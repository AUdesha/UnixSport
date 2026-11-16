import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import Database from "better-sqlite3";
import { createStudentEmail, isStudentEmail } from "../shared/studentEmail.js";

const app = express();
const port = process.env.PORT || 3001;
const databasePath = fileURLToPath(new URL("../students.db", import.meta.url));
const database = new Database(databasePath);

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.pragma("secure_delete = ON");

database.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    registration_number TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    faculty TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS storekeepers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Gym Coach', 'Admin')),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    staff_id INTEGER NOT NULL REFERENCES staff_accounts(id),
    sent_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notification_reads (
    notice_id INTEGER NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    read_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notice_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS app_sessions (
    token_hash TEXT PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    storekeeper_id INTEGER REFERENCES storekeepers(id) ON DELETE CASCADE,
    staff_id INTEGER REFERENCES staff_accounts(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    CHECK ((student_id IS NOT NULL AND storekeeper_id IS NULL AND staff_id IS NULL) OR
           (student_id IS NULL AND storekeeper_id IS NOT NULL AND staff_id IS NULL) OR
           (student_id IS NULL AND storekeeper_id IS NULL AND staff_id IS NOT NULL))
  );

  CREATE TABLE IF NOT EXISTS student_sessions (
    token_hash TEXT PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    storekeeper_id INTEGER REFERENCES storekeepers(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    CHECK ((student_id IS NOT NULL AND storekeeper_id IS NULL) OR
           (student_id IS NULL AND storekeeper_id IS NOT NULL))
  );

  CREATE TABLE IF NOT EXISTS equipment_loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    equipment_id INTEGER REFERENCES equipment_items(id),
    borrowed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_at TEXT,
    returned_at TEXT
  );

  CREATE TABLE IF NOT EXISTS equipment_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS equipment_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES equipment_categories(id),
    item_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    rfid_tag TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'available'
      CHECK (status IN ('available', 'borrowed', 'damaged', 'removed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS published_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    description TEXT NOT NULL,
    published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS equipment_loans_student_borrowed
    ON equipment_loans(student_id, borrowed_at DESC);

  CREATE TABLE IF NOT EXISTS student_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS student_events_owner_date
    ON student_events(student_id, event_date, id DESC);
`);

const studentColumns = database.prepare("PRAGMA table_info(students)").all().map((column) => column.name);
if (!studentColumns.includes("rfid_tag")) {
  database.exec("ALTER TABLE students ADD COLUMN rfid_tag TEXT");
  database.exec("CREATE UNIQUE INDEX students_rfid_tag_unique ON students(rfid_tag) WHERE rfid_tag IS NOT NULL");
}

const loanColumns = database.prepare("PRAGMA table_info(equipment_loans)").all().map((column) => column.name);
if (!loanColumns.includes("equipment_id")) {
  database.exec("ALTER TABLE equipment_loans ADD COLUMN equipment_id INTEGER REFERENCES equipment_items(id)");
}

database.exec("CREATE INDEX IF NOT EXISTS equipment_items_category_status ON equipment_items(category_id, status)");

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const passwordMatches = (password, storedPassword) => {
  if (typeof storedPassword !== "string") return false;

  const [salt, storedHash] = storedPassword.split(":");
  if (!/^[a-f0-9]{32}$/i.test(salt || "") || !/^[a-f0-9]{128}$/i.test(storedHash || "")) {
    return false;
  }

  const hash = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(hash, Buffer.from(storedHash, "hex"));
};

const publicStudent = (student) => ({
  id: student.id,
  fullName: student.full_name,
  regNo: student.registration_number,
  email: student.email,
  faculty: student.faculty,
});

const sessionTokenFromRequest = (request) => {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("student_session="));
  const token = cookie?.slice("student_session=".length);
  return /^[a-f0-9]{64}$/i.test(token || "") ? token : null;
};

const sessionForRequest = (request) => {
  const token = sessionTokenFromRequest(request);
  if (!token) return null;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return database
    .prepare("SELECT student_id, storekeeper_id, staff_id FROM app_sessions WHERE token_hash = ? AND expires_at > ?")
    .get(tokenHash, Date.now()) || null;
};

const createSession = (response, studentId, storekeeperId, staffId) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  database.prepare("DELETE FROM app_sessions WHERE expires_at <= ?").run(Date.now());
  database
    .prepare("INSERT INTO app_sessions (token_hash, student_id, storekeeper_id, staff_id, expires_at) VALUES (?, ?, ?, ?, ?)")
    .run(tokenHash, studentId, storekeeperId, staffId, expiresAt);

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `student_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure}`
  );
};

const storekeeperIdForRequest = (request) => sessionForRequest(request)?.storekeeper_id || null;

app.post("/api/students/register", (request, response) => {
  const { fullName, regNo, password, faculty } = request.body;

  if (
    typeof fullName !== "string" ||
    typeof regNo !== "string" ||
    typeof password !== "string" ||
    typeof faculty !== "string" ||
    !fullName.trim() ||
    !regNo.trim() ||
    !faculty.trim()
  ) {
    return response.status(400).json({ message: "All fields are required." });
  }

  if (fullName.length > 100 || regNo.length > 50 || faculty.length > 100) {
    return response.status(400).json({ message: "One or more fields exceed the allowed length." });
  }

  if (password.length < 8 || password.length > 128) {
    return response.status(400).json({ message: "Password must be between 8 and 128 characters." });
  }

  const email = createStudentEmail(regNo, faculty);
  if (!email) {
    return response.status(400).json({ message: "Enter a valid registration number and select a faculty." });
  }

  try {
    const result = database
      .prepare(`
        INSERT INTO students
          (full_name, registration_number, email, password_hash, faculty)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(fullName.trim(), regNo.trim(), email, hashPassword(password), faculty.trim());
    const student = database.prepare("SELECT * FROM students WHERE id = ?").get(result.lastInsertRowid);

    return response.status(201).json({ student: publicStudent(student) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({ message: "That registration number or email is already registered." });
    }

    return response.status(500).json({ message: "Registration failed." });
  }
});

app.post("/api/students/login", (request, response) => {
  const { email, password, userType } = request.body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length > 128
  ) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (userType === "Student") {
    if (!isStudentEmail(normalizedEmail)) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    const student = database.prepare("SELECT * FROM students WHERE email = ?").get(normalizedEmail);

    if (!student || !passwordMatches(password, student.password_hash)) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    createSession(response, student.id, null, null);
    return response.json({ role: "Student", student: publicStudent(student) });
  }

  if (userType === "Store Keeper") {
    const storekeeper = database.prepare("SELECT * FROM storekeepers WHERE email = ?").get(normalizedEmail);

    if (!storekeeper || !passwordMatches(password, storekeeper.password_hash)) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    createSession(response, null, storekeeper.id, null);
    return response.json({ role: "Store Keeper", storekeeper: { id: storekeeper.id, email: storekeeper.email } });
  }

  if (userType === "Gym Coach" || userType === "Admin") {
    const staff = database
      .prepare("SELECT id, email, role, password_hash FROM staff_accounts WHERE email = ? AND role = ?")
      .get(normalizedEmail, userType);

    if (!staff || !passwordMatches(password, staff.password_hash)) {
      return response.status(401).json({ message: "Invalid email or password." });
    }

    createSession(response, null, null, staff.id);
    return response.json({ role: staff.role, staff: { id: staff.id, email: staff.email, role: staff.role } });
  }

  return response.status(400).json({ message: "Select a valid user type." });
});

app.post("/api/logout", (request, response) => {
  const token = sessionTokenFromRequest(request);
  if (token) {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    database.prepare("DELETE FROM app_sessions WHERE token_hash = ?").run(tokenHash);
    database.prepare("DELETE FROM student_sessions WHERE token_hash = ?").run(tokenHash);
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `student_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`);
  return response.json({ message: "Logged out." });
});

app.get("/api/home/summary", (_request, response) => {
  const users = database.prepare(`
    SELECT (SELECT COUNT(*) FROM students) +
           (SELECT COUNT(*) FROM storekeepers) +
           (SELECT COUNT(*) FROM staff_accounts) AS count
  `).get().count;
  const categories = database.prepare("SELECT COUNT(*) AS count FROM equipment_categories").get().count;
  const events = database.prepare(`
    SELECT id, title, event_date AS eventDate, description
    FROM published_events
    WHERE event_date >= date('now')
    ORDER BY event_date ASC, id DESC
    LIMIT 4
  `).all();
  return response.json({ users, categories, events });
});

app.post("/api/staff/events", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.staff_id) {
    return response.status(401).json({ message: "Log in as a Coach or Admin to publish events." });
  }

  const { title, eventDate, description } = request.body;
  if (
    typeof title !== "string" || !title.trim() || title.length > 120 ||
    typeof eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    typeof description !== "string" || !description.trim() || description.length > 4000
  ) {
    return response.status(400).json({ message: "Enter an event title, valid date, and description." });
  }

  const parsedDate = new Date(`${eventDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
    return response.status(400).json({ message: "Enter a valid event date." });
  }

  const result = database.prepare(`
    INSERT INTO published_events (title, event_date, description)
    VALUES (?, ?, ?)
  `).run(title.trim(), eventDate, description.trim());
  return response.status(201).json({ event: database.prepare(`
    SELECT id, title, event_date AS eventDate, description
    FROM published_events WHERE id = ?
  `).get(result.lastInsertRowid) });
});

app.get("/api/storekeeper/categories", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const categories = database.prepare(`
    SELECT equipment_categories.id, equipment_categories.name,
           COUNT(equipment_items.id) AS itemCount
    FROM equipment_categories
    LEFT JOIN equipment_items ON equipment_items.category_id = equipment_categories.id
      AND equipment_items.status != 'removed'
    GROUP BY equipment_categories.id
    ORDER BY equipment_categories.name COLLATE NOCASE
  `).all();
  return response.json({ categories });
});

app.post("/api/storekeeper/categories", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { name } = request.body;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return response.status(400).json({ message: "Enter a category name up to 80 characters." });
  }
  try {
    const result = database.prepare("INSERT INTO equipment_categories (name) VALUES (?)").run(name.trim());
    return response.status(201).json({ category: { id: result.lastInsertRowid, name: name.trim(), itemCount: 0 } });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That category already exists." });
    throw error;
  }
});

app.patch("/api/storekeeper/categories/:id", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { name } = request.body;
  if (!/^\d+$/.test(request.params.id) || typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return response.status(400).json({ message: "Enter a valid category name." });
  }
  try {
    const result = database.prepare("UPDATE equipment_categories SET name = ? WHERE id = ?").run(name.trim(), Number(request.params.id));
    if (!result.changes) return response.status(404).json({ message: "Equipment category not found." });
    return response.json({ message: "Category updated." });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That category already exists." });
    throw error;
  }
});

app.get("/api/storekeeper/equipment", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const query = typeof request.query.search === "string" ? `%${request.query.search.trim()}%` : "%";
  const equipment = database.prepare(`
    SELECT equipment_items.id, equipment_items.item_code AS itemCode, equipment_items.name,
           equipment_items.rfid_tag AS rfidTag, equipment_items.status,
           equipment_categories.id AS categoryId, equipment_categories.name AS category
    FROM equipment_items
    JOIN equipment_categories ON equipment_categories.id = equipment_items.category_id
    WHERE equipment_items.status != 'removed'
      AND (equipment_items.item_code LIKE ? OR equipment_items.name LIKE ?)
    ORDER BY equipment_items.name COLLATE NOCASE, equipment_items.item_code
  `).all(query, query);
  return response.json({ equipment });
});

app.post("/api/storekeeper/equipment", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { categoryId, itemCode, name } = request.body;
  if (
    !Number.isInteger(categoryId) || typeof itemCode !== "string" || !itemCode.trim() || itemCode.trim().length > 50 ||
    typeof name !== "string" || !name.trim() || name.trim().length > 120
  ) {
    return response.status(400).json({ message: "Enter a category, equipment ID, and name." });
  }
  try {
    const result = database.prepare(`
      INSERT INTO equipment_items (category_id, item_code, name)
      VALUES (?, ?, ?)
    `).run(categoryId, itemCode.trim(), name.trim());
    return response.status(201).json({ equipment: database.prepare(`
      SELECT equipment_items.id, equipment_items.item_code AS itemCode, equipment_items.name,
             equipment_items.rfid_tag AS rfidTag, equipment_items.status,
             equipment_categories.id AS categoryId, equipment_categories.name AS category
      FROM equipment_items JOIN equipment_categories ON equipment_categories.id = equipment_items.category_id
      WHERE equipment_items.id = ?
    `).get(result.lastInsertRowid) });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That equipment ID already exists." });
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return response.status(404).json({ message: "Equipment category not found." });
    throw error;
  }
});

app.patch("/api/storekeeper/equipment/:id", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { name, categoryId, itemCode, status } = request.body;
  if (!/^\d+$/.test(request.params.id)) return response.status(400).json({ message: "Invalid equipment item." });

  if (status !== undefined) {
    if (!["available", "damaged", "removed"].includes(status)) {
      return response.status(400).json({ message: "Choose available, damaged, or removed status." });
    }
    const result = database.prepare(`
      UPDATE equipment_items SET status = ? WHERE id = ? AND status != 'borrowed'
    `).run(status, Number(request.params.id));
    if (!result.changes) return response.status(409).json({ message: "Borrowed equipment cannot be changed here." });
    return response.json({ message: "Equipment status updated." });
  }

  if (
    typeof name !== "string" || !name.trim() || name.trim().length > 120 || !Number.isInteger(categoryId) ||
    (itemCode !== undefined && (typeof itemCode !== "string" || !itemCode.trim() || itemCode.trim().length > 50))
  ) {
    return response.status(400).json({ message: "Enter a category and equipment name." });
  }
  try {
    const result = database.prepare(`
      UPDATE equipment_items SET name = ?, category_id = ?, item_code = COALESCE(?, item_code)
      WHERE id = ? AND status != 'removed'
    `).run(name.trim(), categoryId, itemCode?.trim() || null, Number(request.params.id));
    if (!result.changes) return response.status(404).json({ message: "Equipment item not found." });
    return response.json({ message: "Equipment details updated." });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That equipment ID already exists." });
    if (error.code === "SQLITE_CONSTRAINT_FOREIGNKEY") return response.status(404).json({ message: "Equipment category not found." });
    throw error;
  }
});

app.get("/api/storekeeper/students", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const regNo = typeof request.query.regNo === "string" ? request.query.regNo.trim() : "";
  if (!regNo) return response.json({ students: [] });
  const students = database.prepare(`
    SELECT id, full_name AS fullName, registration_number AS regNo,
           faculty, rfid_tag AS rfidTag
    FROM students
    WHERE registration_number LIKE ? COLLATE NOCASE
    ORDER BY registration_number LIMIT 10
  `).all(`%${regNo}%`);
  return response.json({ students });
});

app.post("/api/storekeeper/students/:id/rfid", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { tag } = request.body;
  if (!/^\d+$/.test(request.params.id) || typeof tag !== "string" || !tag.trim() || tag.trim().length > 100) {
    return response.status(400).json({ message: "Enter a student and RFID tag." });
  }
  if (database.prepare("SELECT id FROM equipment_items WHERE rfid_tag = ?").get(tag.trim())) {
    return response.status(409).json({ message: "That RFID tag is already assigned to equipment." });
  }
  try {
    const result = database.prepare("UPDATE students SET rfid_tag = ? WHERE id = ?").run(tag.trim(), Number(request.params.id));
    if (!result.changes) return response.status(404).json({ message: "Student not found." });
    return response.json({ message: "RFID tag assigned to student." });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That RFID tag is already assigned." });
    throw error;
  }
});

app.post("/api/storekeeper/equipment/:id/rfid", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { tag } = request.body;
  if (!/^\d+$/.test(request.params.id) || typeof tag !== "string" || !tag.trim() || tag.trim().length > 100) {
    return response.status(400).json({ message: "Enter an equipment item and RFID tag." });
  }
  if (database.prepare("SELECT id FROM students WHERE rfid_tag = ?").get(tag.trim())) {
    return response.status(409).json({ message: "That RFID tag is already assigned to a student." });
  }
  try {
    const result = database.prepare("UPDATE equipment_items SET rfid_tag = ? WHERE id = ? AND status != 'removed'").run(tag.trim(), Number(request.params.id));
    if (!result.changes) return response.status(404).json({ message: "Equipment item not found." });
    return response.json({ message: "RFID card assigned to equipment." });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") return response.status(409).json({ message: "That RFID tag is already assigned." });
    throw error;
  }
});

app.get("/api/storekeeper/scan/:tag", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const tag = request.params.tag.trim();
  const student = database.prepare(`
    SELECT id, full_name AS fullName, registration_number AS regNo, faculty
    FROM students WHERE rfid_tag = ?
  `).get(tag);
  if (student) return response.json({ type: "student", student });
  const equipment = database.prepare(`
    SELECT equipment_items.id, equipment_items.item_code AS itemCode, equipment_items.name,
           equipment_items.status, equipment_categories.name AS category
    FROM equipment_items JOIN equipment_categories ON equipment_categories.id = equipment_items.category_id
    WHERE equipment_items.rfid_tag = ? OR equipment_items.item_code = ?
  `).get(tag, tag);
  if (equipment) return response.json({ type: "equipment", equipment });
  return response.status(404).json({ message: "No student or equipment matches this RFID value." });
});

app.get("/api/storekeeper/notices", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to view notices." });
  }
  const notices = database.prepare(`
    SELECT notices.id, notices.title, notices.message, notices.sent_at AS sentAt,
           staff_accounts.role AS senderRole
    FROM notices JOIN staff_accounts ON staff_accounts.id = notices.staff_id
    ORDER BY notices.sent_at DESC, notices.id DESC LIMIT 50
  `).all();
  return response.json({ notices });
});

app.get("/api/storekeeper/reports/monthly", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to view reports." });
  }
  const month = typeof request.query.month === "string" ? request.query.month : "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return response.status(400).json({ message: "Choose a valid report month." });
  }
  const loans = database.prepare(`
    SELECT equipment_loans.id, students.full_name AS studentName,
           students.registration_number AS regNo, equipment_loans.item_name AS itemName,
           equipment_loans.borrowed_at AS borrowedAt, equipment_loans.due_at AS dueAt,
           equipment_loans.returned_at AS returnedAt
    FROM equipment_loans JOIN students ON students.id = equipment_loans.student_id
    WHERE substr(equipment_loans.borrowed_at, 1, 7) = ?
    ORDER BY equipment_loans.borrowed_at, equipment_loans.id
  `).all(month);
  return response.json({ month, loans });
});

app.post("/api/storekeeper/equipment-loans/issue", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }
  const { regNo, equipmentIds, dueAt } = request.body;
  if (
    typeof regNo !== "string" || !regNo.trim() || !Array.isArray(equipmentIds) ||
    !equipmentIds.length || equipmentIds.length > 30 ||
    equipmentIds.some((id) => !Number.isInteger(id) || id < 1) ||
    new Set(equipmentIds).size !== equipmentIds.length ||
    typeof dueAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueAt)
  ) {
    return response.status(400).json({ message: "Select a student, equipment, and due date." });
  }
  const student = database.prepare("SELECT id FROM students WHERE lower(trim(registration_number)) = lower(?)").get(regNo.trim());
  if (!student) return response.status(404).json({ message: "No student found with that university ID." });
  const parsedDate = new Date(`${dueAt}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== dueAt) {
    return response.status(400).json({ message: "Enter a valid due date." });
  }

  try {
    const issueItems = database.transaction(() => equipmentIds.map((id) => {
      const item = database.prepare(`
        SELECT id, name, status FROM equipment_items WHERE id = ?
      `).get(id);
      if (!item || item.status !== "available") throw new Error("An equipment item is no longer available. Refresh the list and try again.");
      database.prepare(`
        INSERT INTO equipment_loans (student_id, item_name, equipment_id, due_at)
        VALUES (?, ?, ?, ?)
      `).run(student.id, item.name, item.id, dueAt);
      database.prepare("UPDATE equipment_items SET status = 'borrowed' WHERE id = ?").run(item.id);
      return { id: item.id, name: item.name };
    }));
    return response.status(201).json({ message: "Equipment issued.", items: issueItems() });
  } catch (error) {
    if (error.message.includes("no longer available")) return response.status(409).json({ message: error.message });
    throw error;
  }
});

app.get("/api/students/equipment-history", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.student_id) {
    return response.status(401).json({ message: "Log in as a student to view equipment history." });
  }

  const loans = database.prepare(`
    SELECT id, item_name AS itemName, borrowed_at AS borrowedAt,
           due_at AS dueAt, returned_at AS returnedAt
    FROM equipment_loans
    WHERE student_id = ?
    ORDER BY borrowed_at DESC, id DESC
  `).all(session.student_id);

  return response.json({ loans });
});

app.get("/api/storekeeper/equipment-loans", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }

  const loans = database.prepare(`
    SELECT equipment_loans.id, equipment_loans.item_name AS itemName,
           equipment_loans.borrowed_at AS borrowedAt, equipment_loans.due_at AS dueAt,
           equipment_loans.returned_at AS returnedAt,
           students.full_name AS studentName,
           students.registration_number AS regNo
    FROM equipment_loans
    JOIN students ON students.id = equipment_loans.student_id
    ORDER BY equipment_loans.borrowed_at DESC, equipment_loans.id DESC
  `).all();

  return response.json({ loans });
});

app.post("/api/storekeeper/equipment-loans", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }

  const { regNo, itemName, dueAt } = request.body;
  if (
    typeof regNo !== "string" || !regNo.trim() || regNo.length > 50 ||
    typeof itemName !== "string" || !itemName.trim() || itemName.length > 120 ||
    (dueAt !== undefined && dueAt !== "" &&
      (typeof dueAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dueAt) || Number.isNaN(Date.parse(dueAt))))
  ) {
    return response.status(400).json({ message: "Enter a valid registration number, item, and due date." });
  }

  const student = database
    .prepare("SELECT id FROM students WHERE lower(trim(registration_number)) = lower(?)")
    .get(regNo.trim());
  if (!student) {
    return response.status(404).json({ message: "No student found with that registration number." });
  }

  const result = database.prepare(`
    INSERT INTO equipment_loans (student_id, item_name, due_at)
    VALUES (?, ?, ?)
  `).run(student.id, itemName.trim(), dueAt || null);

  return response.status(201).json({ id: result.lastInsertRowid, message: "Equipment loan recorded." });
});

app.post("/api/storekeeper/equipment-loans/:id/return", (request, response) => {
  if (!storekeeperIdForRequest(request)) {
    return response.status(401).json({ message: "Log in as a Store Keeper to continue." });
  }

  if (!/^\d+$/.test(request.params.id)) {
    return response.status(400).json({ message: "Invalid equipment loan." });
  }

  const result = database
    .prepare("UPDATE equipment_loans SET returned_at = CURRENT_TIMESTAMP WHERE id = ? AND returned_at IS NULL")
    .run(Number(request.params.id));
  if (result.changes === 0) {
    const loan = database.prepare("SELECT id FROM equipment_loans WHERE id = ?").get(Number(request.params.id));
    return response.status(loan ? 409 : 404).json({
      message: loan ? "This item has already been returned." : "Equipment loan not found.",
    });
  }

  const loan = database.prepare("SELECT equipment_id FROM equipment_loans WHERE id = ?").get(Number(request.params.id));
  if (loan?.equipment_id) {
    database.prepare("UPDATE equipment_items SET status = 'available' WHERE id = ? AND status = 'borrowed'")
      .run(loan.equipment_id);
  }

  return response.json({ message: "Equipment return recorded." });
});

app.get("/api/students/notices", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.student_id) {
    return response.status(401).json({ message: "Log in as a student to view notifications." });
  }

  const notices = database.prepare(`
    SELECT notices.id, notices.title, notices.message, notices.sent_at AS sentAt,
           staff_accounts.role AS senderRole, notification_reads.read_at AS readAt
    FROM notices
    JOIN staff_accounts ON staff_accounts.id = notices.staff_id
    LEFT JOIN notification_reads
      ON notification_reads.notice_id = notices.id
     AND notification_reads.student_id = ?
    ORDER BY notices.sent_at DESC, notices.id DESC
  `).all(session.student_id);

  return response.json({ notices, unreadCount: notices.filter((notice) => !notice.readAt).length });
});

app.post("/api/students/notices/:id/read", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.student_id) {
    return response.status(401).json({ message: "Log in as a student to update notifications." });
  }

  if (!/^\d+$/.test(request.params.id)) {
    return response.status(400).json({ message: "Invalid notification." });
  }

  const noticeId = Number(request.params.id);
  const notice = database.prepare("SELECT id FROM notices WHERE id = ?").get(noticeId);
  if (!notice) return response.status(404).json({ message: "Notification not found." });

  database.prepare("INSERT OR IGNORE INTO notification_reads (notice_id, student_id) VALUES (?, ?)")
    .run(noticeId, session.student_id);
  return response.json({ message: "Notification marked as read." });
});

app.get("/api/staff/notices", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.staff_id) {
    return response.status(401).json({ message: "Log in as a Coach or Admin to manage notices." });
  }

  const notices = database.prepare(`
    SELECT notices.id, notices.title, notices.message, notices.sent_at AS sentAt,
           staff_accounts.role AS senderRole, staff_accounts.email AS senderEmail
    FROM notices
    JOIN staff_accounts ON staff_accounts.id = notices.staff_id
    ORDER BY notices.sent_at DESC, notices.id DESC
  `).all();
  return response.json({ notices });
});

app.post("/api/staff/notices", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.staff_id) {
    return response.status(401).json({ message: "Log in as a Coach or Admin to send notices." });
  }

  const { title, message } = request.body;
  if (
    typeof title !== "string" || !title.trim() || title.length > 120 ||
    typeof message !== "string" || !message.trim() || message.length > 4000
  ) {
    return response.status(400).json({ message: "Title and message are required. Keep the title under 120 characters." });
  }

  const result = database.prepare("INSERT INTO notices (title, message, staff_id) VALUES (?, ?, ?)")
    .run(title.trim(), message.trim(), session.staff_id);
  const notice = database.prepare(`
    SELECT notices.id, notices.title, notices.message, notices.sent_at AS sentAt,
           staff_accounts.role AS senderRole, staff_accounts.email AS senderEmail
    FROM notices
    JOIN staff_accounts ON staff_accounts.id = notices.staff_id
    WHERE notices.id = ?
  `).get(result.lastInsertRowid);

  return response.status(201).json({ notice });
});

app.get("/api/students/events", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.student_id) {
    return response.status(401).json({ message: "Log in as a student to view events." });
  }

  const events = database.prepare(`
    SELECT id, title, event_date AS eventDate, description, created_at AS createdAt
    FROM student_events
    WHERE student_id = ?
    ORDER BY event_date ASC, id DESC
  `).all(session.student_id);

  return response.json({ events });
});

app.post("/api/students/events", (request, response) => {
  const session = sessionForRequest(request);
  if (!session?.student_id) {
    return response.status(401).json({ message: "Log in as a student to create an event." });
  }

  const { title, eventDate, description } = request.body;
  if (
    typeof title !== "string" || !title.trim() || title.length > 120 ||
    typeof eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
    typeof description !== "string" || !description.trim() || description.length > 4000
  ) {
    return response.status(400).json({ message: "Enter a title, valid event date, and description." });
  }

  const parsedDate = new Date(`${eventDate}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== eventDate) {
    return response.status(400).json({ message: "Enter a valid event date." });
  }

  const result = database.prepare(`
    INSERT INTO student_events (student_id, title, event_date, description)
    VALUES (?, ?, ?, ?)
  `).run(session.student_id, title.trim(), eventDate, description.trim());
  const event = database.prepare(`
    SELECT id, title, event_date AS eventDate, description, created_at AS createdAt
    FROM student_events
    WHERE id = ? AND student_id = ?
  `).get(result.lastInsertRowid, session.student_id);

  return response.status(201).json({ event });
});

app.listen(port, () => {
  console.log(`Student API running at http://localhost:${port}`);
});