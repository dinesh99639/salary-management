import express from 'express';
import { db } from './db.js';

const router = express.Router();

// Helper to validate employee input
function validateEmployee(data) {
  const errors = [];
  if (!data.full_name || typeof data.full_name !== 'string' || data.full_name.trim() === '') {
    errors.push('Full name is required.');
  }
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    errors.push('Valid email is required.');
  }
  if (!data.job_title || typeof data.job_title !== 'string' || data.job_title.trim() === '') {
    errors.push('Job title is required.');
  }
  if (!data.department || typeof data.department !== 'string' || data.department.trim() === '') {
    errors.push('Department is required.');
  }
  if (!data.country || typeof data.country !== 'string' || data.country.trim() === '') {
    errors.push('Country is required.');
  }
  
  const salary = parseFloat(data.salary);
  if (isNaN(salary) || salary <= 0) {
    errors.push('Salary must be a positive number.');
  }
  
  if (!data.hire_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.hire_date)) {
    errors.push('Hire date must be in YYYY-MM-DD format.');
  }
  
  const validStatuses = ['Active', 'On Leave', 'Terminated'];
  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push('Status must be Active, On Leave, or Terminated.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      full_name: data.full_name?.trim(),
      email: data.email?.trim().toLowerCase(),
      job_title: data.job_title?.trim(),
      department: data.department?.trim(),
      country: data.country?.trim(),
      salary: salary,
      hire_date: data.hire_date,
      status: data.status
    }
  };
}

// 1. GET /api/employees - paginated, searchable, filterable, sortable list
router.get('/employees', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const search = req.query.search || '';
    const country = req.query.country || '';
    const department = req.query.department || '';
    const jobTitle = req.query.jobTitle || '';
    
    const sortBy = ['full_name', 'salary', 'hire_date', 'id'].includes(req.query.sortBy) ? req.query.sortBy : 'id';
    const sortOrder = ['asc', 'desc'].includes(req.query.sortOrder?.toLowerCase()) ? req.query.sortOrder.toLowerCase() : 'asc';

    let queryStr = 'SELECT * FROM employees WHERE 1=1';
    let countStr = 'SELECT COUNT(*) as count FROM employees WHERE 1=1';
    const params = [];

    if (search) {
      queryStr += ' AND (full_name LIKE ? OR email LIKE ?)';
      countStr += ' AND (full_name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (country) {
      queryStr += ' AND country = ?';
      countStr += ' AND country = ?';
      params.push(country);
    }

    if (department) {
      queryStr += ' AND department = ?';
      countStr += ' AND department = ?';
      params.push(department);
    }

    if (jobTitle) {
      queryStr += ' AND job_title = ?';
      countStr += ' AND job_title = ?';
      params.push(jobTitle);
    }

    // Order and Limit params
    queryStr += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;

    const totalCountRow = db.prepare(countStr).get(...params);
    const totalCount = totalCountRow ? totalCountRow.count : 0;

    const dataParams = [...params, limit, offset];
    const employees = db.prepare(queryStr).all(...dataParams);

    res.json({
      employees,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
// 2. GET /api/employees/:id - view single employee
router.get('/employees/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST /api/employees - create employee
router.post('/employees', (req, res) => {
  try {
    const validation = validateEmployee(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { full_name, email, job_title, department, country, salary, hire_date, status } = validation.sanitized;

    // Check unique email
    const emailCheck = db.prepare('SELECT id FROM employees WHERE email = ?').get(email);
    if (emailCheck) {
      return res.status(400).json({ errors: ['Email address is already in use by another employee.'] });
    }

    const result = db.prepare(`
      INSERT INTO employees (full_name, email, job_title, department, country, salary, hire_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(full_name, email, job_title, department, country, salary, hire_date, status);

    const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /api/employees/:id - update employee
router.put('/employees/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const validation = validateEmployee(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { full_name, email, job_title, department, country, salary, hire_date, status } = validation.sanitized;

    // Check unique email (excluding current employee)
    const emailCheck = db.prepare('SELECT id FROM employees WHERE email = ? AND id != ?').get(email, req.params.id);
    if (emailCheck) {
      return res.status(400).json({ errors: ['Email address is already in use by another employee.'] });
    }

    db.prepare(`
      UPDATE employees 
      SET full_name = ?, email = ?, job_title = ?, department = ?, country = ?, salary = ?, hire_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(full_name, email, job_title, department, country, salary, hire_date, status, req.params.id);

    const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /api/employees/:id - delete employee
router.delete('/employees/:id', (req, res) => {
  try {
    const employee = db.prepare('SELECT id FROM employees WHERE id = ?').get(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
    res.json({ message: 'Employee deleted successfully.', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/

// 6. GET /api/insights/salary - salary analytics
router.get('/insights/salary', (req, res) => {
  try {
    // Global metrics
    const globalMetrics = db.prepare(`
      SELECT 
        COUNT(*) as headcount, 
        SUM(salary) as total_budget, 
        AVG(salary) as avg_salary
      FROM employees
    `).get();

    // Country aggregates
    const countryMetrics = db.prepare(`
      SELECT 
        country, 
        COUNT(*) as headcount, 
        MIN(salary) as min_salary, 
        MAX(salary) as max_salary, 
        AVG(salary) as avg_salary,
        SUM(salary) as total_salary
      FROM employees 
      GROUP BY country
      ORDER BY headcount DESC
    `).all();

    // Department aggregates
    const departmentMetrics = db.prepare(`
      SELECT 
        department, 
        COUNT(*) as headcount, 
        MIN(salary) as min_salary,
        MAX(salary) as max_salary,
        AVG(salary) as avg_salary,
        SUM(salary) as total_salary
      FROM employees 
      GROUP BY department
      ORDER BY avg_salary DESC
    `).all();

    // Status breakdown (Extra meaningful metric)
    const statusMetrics = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as headcount
      FROM employees
      GROUP BY status
    `).all();

    res.json({
      global: {
        headcount: globalMetrics.headcount || 0,
        totalBudget: globalMetrics.total_budget || 0,
        avgSalary: globalMetrics.avg_salary || 0
      },
      countries: countryMetrics,
      departments: departmentMetrics,
      statuses: statusMetrics
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET /api/insights/job-titles - average salary by job title in a specific country
router.get('/insights/job-titles', (req, res) => {
  try {
    const { country } = req.query;
    if (!country) {
      return res.status(400).json({ error: 'Country parameter is required.' });
    }

    const jobTitleMetrics = db.prepare(`
      SELECT 
        job_title, 
        COUNT(*) as headcount, 
        MIN(salary) as min_salary,
        MAX(salary) as max_salary,
        AVG(salary) as avg_salary
      FROM employees 
      WHERE country = ?
      GROUP BY job_title
      ORDER BY avg_salary DESC
    `).all(country);

    res.json(jobTitleMetrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*
*/

// 8. GET /api/meta - categories metadata (countries, departments, jobs, etc.) to populate dropdowns
router.get('/meta', (req, res) => {
  try {
    const countries = db.prepare('SELECT DISTINCT country FROM employees ORDER BY country ASC').all().map(r => r.country);
    const departments = db.prepare('SELECT DISTINCT department FROM employees ORDER BY department ASC').all().map(r => r.department);
    const jobTitles = db.prepare('SELECT DISTINCT job_title FROM employees ORDER BY job_title ASC').all().map(r => r.job_title);
    
    // Map job titles by department for intelligent cascading form dropdowns!
    const jobTitleDeptMap = {};
    const rows = db.prepare('SELECT DISTINCT department, job_title FROM employees').all();
    rows.forEach(r => {
      if (!jobTitleDeptMap[r.department]) {
        jobTitleDeptMap[r.department] = [];
      }
      jobTitleDeptMap[r.department].push(r.job_title);
    });

    res.json({
      countries,
      departments,
      jobTitles,
      jobTitleDeptMap
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
