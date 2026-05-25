import request from 'supertest';
import app from '../server.js';
import { db, seedDb } from '../db.js';

describe('Express REST API TDD Integration Suite', () => {
  beforeAll(() => {
    const mockFirsts = ['Alice', 'Bob', 'Charlie'];
    const mockLasts = ['Smith', 'Jones'];
    seedDb(mockFirsts, mockLasts);
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /health', () => {
    it('should return health status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/employees', () => {
    it('should return a paginated list of employees', async () => {
      const res = await request(app).get('/api/employees?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('employees');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.employees.length).toBeLessThanOrEqual(5);
      expect(res.body.pagination.totalCount).toBe(6);
    });

    it('should filter by country if provided', async () => {
      const allRes = await request(app).get('/api/employees?limit=10');
      const testEmployee = allRes.body.employees[0];
      const country = testEmployee.country;

      const filteredRes = await request(app).get(`/api/employees?country=${encodeURIComponent(country)}`);
      expect(filteredRes.status).toBe(200);
      filteredRes.body.employees.forEach(emp => {
        expect(emp.country).toBe(country);
      });
    });

    it('should support searching by name', async () => {
      const res = await request(app).get('/api/employees?search=Alice');
      expect(res.status).toBe(200);
      res.body.employees.forEach(emp => {
        expect(emp.full_name).toContain('Alice');
      });
    });
  });

  describe('GET /api/meta', () => {
    it('should return dropdown metadata lists and department job mappings', async () => {
      const res = await request(app).get('/api/meta');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('countries');
      expect(res.body).toHaveProperty('departments');
      expect(res.body).toHaveProperty('jobTitles');
      expect(res.body).toHaveProperty('jobTitleDeptMap');
      expect(res.body.countries.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/insights/salary', () => {
    it('should return global and structured department/country compensation insights', async () => {
      const res = await request(app).get('/api/insights/salary');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('global');
      expect(res.body).toHaveProperty('countries');
      expect(res.body).toHaveProperty('departments');
      expect(res.body.global.headcount).toBe(6);
    });
  });

  describe('GET /api/insights/job-titles', () => {
    it('should return average salary by job title in a country', async () => {
      const allRes = await request(app).get('/api/employees?limit=1');
      const country = allRes.body.employees[0].country;

      const res = await request(app).get(`/api/insights/job-titles?country=${encodeURIComponent(country)}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('job_title');
        expect(res.body[0]).toHaveProperty('avg_salary');
      }
    });

    it('should return 400 if country parameter is missing', async () => {
      const res = await request(app).get('/api/insights/job-titles');
      expect(res.status).toBe(400);
    });

    it('should return average salary by job title globally if country is All', async () => {
      const res = await request(app).get('/api/insights/job-titles?country=All');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('job_title');
      expect(res.body[0]).toHaveProperty('avg_salary');
    });
  });

  describe('CRUD Operations /api/employees', () => {
    let testEmployeeId;

    it('should create a new employee with valid inputs', async () => {
      const payload = {
        full_name: 'John Doe',
        email: 'john.doe@organization.com',
        job_title: 'Software Engineer',
        department: 'Engineering',
        country: 'United States',
        salary: 105000,
        hire_date: '2025-01-15',
        status: 'Active'
      };

      const res = await request(app).post('/api/employees').send(payload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.full_name).toBe('John Doe');
      testEmployeeId = res.body.id;
    });

    it('should prevent creating employee with negative salary', async () => {
      const payload = {
        full_name: 'Jane Doe',
        email: 'jane.doe@organization.com',
        job_title: 'UX Designer',
        department: 'Design',
        country: 'United States',
        salary: -50000,
        hire_date: '2025-01-15',
        status: 'Active'
      };

      const res = await request(app).post('/api/employees').send(payload);
      expect(res.status).toBe(400);
      expect(res.body.errors).toContain('Salary must be a positive number.');
    });

    it('should retrieve a single employee by ID', async () => {
      const res = await request(app).get(`/api/employees/${testEmployeeId}`);
      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe('John Doe');
    });

    it('should update an existing employee details', async () => {
      const payload = {
        full_name: 'John Doe Sr.',
        email: 'john.doe@organization.com',
        job_title: 'Senior Software Engineer',
        department: 'Engineering',
        country: 'United States',
        salary: 130000,
        hire_date: '2025-01-15',
        status: 'Active'
      };

      const res = await request(app).put(`/api/employees/${testEmployeeId}`).send(payload);
      expect(res.status).toBe(200);
      expect(res.body.full_name).toBe('John Doe Sr.');
      expect(res.body.job_title).toBe('Senior Software Engineer');
    });

    it('should delete an employee by ID', async () => {
      const deleteRes = await request(app).delete(`/api/employees/${testEmployeeId}`);
      expect(deleteRes.status).toBe(200);

      const getRes = await request(app).get(`/api/employees/${testEmployeeId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
