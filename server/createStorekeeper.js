import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const email = process.env.STOREKEEPER_EMAIL?.trim().toLowerCase();
const password = process.env.STOREKEEPER_PASSWORD;

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 12) {
  console.error("Set STOREKEEPER_EMAIL and STOREKEEPER_PASSWORD (at least 12 characters) before running this script.");
  process.exit(1);
}

const databasePath = fileURLToPath(new URL("../students.db", import.meta.url));
const database = new Database(databasePath);
database.exec(`
  CREATE TABLE IF NOT EXISTS storekeepers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const salt = crypto.randomBytes(16).toString("hex");
const passwordHash = crypto.scryptSync(password, salt, 64).toString("hex");
database.prepare(`
  INSERT INTO storekeepers (email, password_hash)
  VALUES (?, ?)
  ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash
`).run(email, `${salt}:${passwordHash}`);

database.close();
console.log(`Store Keeper account created or updated for ${email}.`);