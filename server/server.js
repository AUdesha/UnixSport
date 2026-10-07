import crypto from "node:crypto";
import express from "express";
import Database from "better-sqlite3";

const app = express();
const port = process.env.PORT || 3001;
const database = new Database("students.db");

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

app.use(express.json());

const isUniversityEmail = (email) => /^[^\s@]+@[^\s@]+\.(edu|ac)(\.[a-z]{2,})?$/i.test(email);

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const passwordMatches = (password, storedPassword) => {
  const [salt, storedHash] = storedPassword.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
};

const publicStudent = (student) => ({
  id: student.id,
  fullName: student.full_name,
  regNo: student.registration_number,
  email: student.email,
  faculty: student.faculty,
});

app.post("/api/students/register", (request, response) => {
  const { fullName, regNo, email, password, faculty } = request.body;

  if (!fullName || !regNo || !email || !password || !faculty) {
    return response.status(400).json({ message: "All fields are required." });
  }

  if (!isUniversityEmail(email.trim())) {
    return response.status(400).json({ message: "Use a valid university email ending in .edu or .ac." });
  }

  try {
    const result = database
      .prepare(`
        INSERT INTO students
          (full_name, registration_number, email, password_hash, faculty)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(fullName.trim(), regNo.trim(), email.trim().toLowerCase(), hashPassword(password), faculty);
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
  const { email, password } = request.body;

  if (!email || !isUniversityEmail(email.trim())) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  const student = database.prepare("SELECT * FROM students WHERE email = ?").get(email?.trim().toLowerCase());

  if (!student || !passwordMatches(password || "", student.password_hash)) {
    return response.status(401).json({ message: "Invalid email or password." });
  }

  return response.json({ student: publicStudent(student) });
});

app.listen(port, () => {
  console.log(`Student API running at http://localhost:${port}`);
});