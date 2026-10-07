import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const role = process.env.STAFF_ROLE;
const email = process.env.STAFF_EMAIL?.trim().toLowerCase();
const password = process.env.STAFF_PASSWORD;

if (
  !["Gym Coach", "Admin"].includes(role) ||
  !email ||
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
  !password ||
  password.length < 12 ||
  password.length > 128
) {
  console.error("Set STAFF_ROLE, STAFF_EMAIL, and STAFF_PASSWORD (12-128 characters) before running this script.");
  process.exit(1);
}

const databasePath = fileURLToPath(new URL("../students.db", import.meta.url));
const database = new Database(databasePath);
database.exec(`
  CREATE TABLE IF NOT EXISTS staff_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('Gym Coach', 'Admin')),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
database.prepare(`
  INSERT INTO staff_accounts (email, role, password_hash)
  VALUES (?, ?, ?)
  ON CONFLICT(email) DO UPDATE SET role = excluded.role, password_hash = excluded.password_hash
`).run(email, role, `${salt}:${passwordHash}`);

database.close();
console.log(`${role} account created or updated for ${email}.`);