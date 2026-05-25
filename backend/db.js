import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'salary_management.db');
export const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      job_title TEXT NOT NULL,
      department TEXT NOT NULL,
      country TEXT NOT NULL,
      salary REAL NOT NULL,
      hire_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_employees_country_job_title ON employees (country, job_title);
    CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department);
    CREATE INDEX IF NOT EXISTS idx_employees_search ON employees (full_name, email);
  `);
}
