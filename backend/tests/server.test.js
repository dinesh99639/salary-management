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
});
