import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'salary_management.db');
export const db = new Database(dbPath);

// Enable foreign keys
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

// Deterministic seedable pseudo-random generator (LCG)
// Ensures that seeding is completely reproducible and deterministic
function createRandom(seedVal) {
  let s = seedVal;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function seedDb(firstNames, lastNames) {
  // Clear existing employees
  db.exec('DELETE FROM employees');
  // Reset auto-increment
  db.exec("DELETE FROM sqlite_sequence WHERE name='employees'");

  const random = createRandom(42);

  const countries = [
    'United States', 'United Kingdom', 'India', 'Germany', 
    'Singapore', 'Canada', 'Australia', 'Japan', 'Brazil', 'South Africa'
  ];

  const departments = [
    'Engineering', 'Product Management', 'Design', 
    'Marketing', 'Sales', 'Finance', 'Human Resources'
  ];

  const jobsByDept = {
    'Engineering': ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager', 'QA Engineer', 'DevOps Engineer'],
    'Product Management': ['Product Manager', 'Senior Product Manager', 'Director of Product'],
    'Design': ['UX Designer', 'Senior UI/UX Designer', 'Product Designer'],
    'Marketing': ['Marketing Coordinator', 'Marketing Manager', 'Director of Marketing'],
    'Sales': ['Sales Executive', 'Account Manager', 'VP of Sales'],
    'Finance': ['Financial Analyst', 'Senior Accountant', 'Finance Director'],
    'Human Resources': ['HR Specialist', 'HR Manager', 'Chief People Officer']
  };

  // Base salaries for various job titles
  const baseSalaries = {
    'Software Engineer': 80000,
    'Senior Software Engineer': 120000,
    'Engineering Manager': 160000,
    'QA Engineer': 65000,
    'DevOps Engineer': 90000,
    'Product Manager': 85000,
    'Senior Product Manager': 125000,
    'Director of Product': 170000,
    'UX Designer': 75000,
    'Senior UI/UX Designer': 110000,
    'Product Designer': 80000,
    'Marketing Coordinator': 50000,
    'Marketing Manager': 90000,
    'Director of Marketing': 140000,
    'Sales Executive': 60000,
    'Account Manager': 70000,
    'VP of Sales': 180000,
    'Financial Analyst': 75000,
    'Senior Accountant': 95000,
    'Finance Director': 150000,
    'HR Specialist': 55000,
    'HR Manager': 90000,
    'Chief People Officer': 175000
  };

  // Country multipliers for local standard of living conversions
  const countryMultipliers = {
    'United States': 1.35,
    'United Kingdom': 1.0,
    'Germany': 1.05,
    'Singapore': 1.15,
    'Canada': 0.95,
    'Australia': 1.0,
    'Japan': 0.9,
    'India': 0.45,
    'Brazil': 0.35,
    'South Africa': 0.3
  };

  const statuses = ['Active', 'On Leave', 'Terminated'];
  const statusWeights = [0.90, 0.07, 0.03]; // 90% active, 7% leave, 3% terminated

  // Generate combinations
  const employees = [];
  let emailSet = new Set();

  for (let i = 0; i < firstNames.length; i++) {
    for (let j = 0; j < lastNames.length; j++) {
      const firstName = firstNames[i].trim();
      const lastName = lastNames[j].trim();
      if (!firstName || !lastName) continue;

      const fullName = `${firstName} ${lastName}`;
      
      // Ensure unique email
      let emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
      let email = `${emailBase}@organization.com`;
      let counter = 1;
      while (emailSet.has(email)) {
        email = `${emailBase}${counter}@organization.com`;
        counter++;
      }
      emailSet.add(email);

      // Select Department & Job Title
      const deptIndex = Math.floor(random() * departments.length);
      const department = departments[deptIndex];
      const jobs = jobsByDept[department];
      const jobIndex = Math.floor(random() * jobs.length);
      const jobTitle = jobs[jobIndex];

      // Select Country
      const countryIndex = Math.floor(random() * countries.length);
      const country = countries[countryIndex];

      // Calculate Salary based on job title, country multiplier, and minor random variation (+/- 12%)
      const baseSalary = baseSalaries[jobTitle] || 70000;
      const multiplier = countryMultipliers[country] || 1.0;
      const variation = 1 + (random() * 0.24 - 0.12);
      const salary = Math.round(baseSalary * multiplier * variation * 100) / 100;

      // Select Status
      let statusVal = 'Active';
      const statusRand = random();
      if (statusRand < statusWeights[0]) {
        statusVal = statuses[0];
      } else if (statusRand < statusWeights[0] + statusWeights[1]) {
        statusVal = statuses[1];
      } else {
        statusVal = statuses[2];
      }

      // Generate Hire Date (between 2017 and 2026)
      const startYear = 2017;
      const endYear = 2026;
      const year = startYear + Math.floor(random() * (endYear - startYear));
      const month = String(1 + Math.floor(random() * 12)).padStart(2, '0');
      const day = String(1 + Math.floor(random() * 28)).padStart(2, '0'); // Avoid 29/30/31 for simplicity
      const hireDate = `${year}-${month}-${day}`;

      employees.push({
        fullName,
        email,
        jobTitle,
        department,
        country,
        salary,
        hireDate,
        statusVal
      });
    }
  }

  // Insert using a single high-performance transaction
  const insertStmt = db.prepare(`
    INSERT INTO employees (full_name, email, job_title, department, country, salary, hire_date, status)
    VALUES (@fullName, @email, @jobTitle, @department, @country, @salary, @hireDate, @statusVal)
  `);

  const runTransaction = db.transaction((list) => {
    for (const emp of list) {
      insertStmt.run(emp);
    }
  });

  const startTime = Date.now();
  runTransaction(employees);
  const endTime = Date.now();

  return {
    count: employees.length,
    durationMs: endTime - startTime
  };
}
