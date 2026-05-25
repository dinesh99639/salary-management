import { initDb, seedDb, db } from '../db.js';

describe('Database Schema Test', () => {
  beforeAll(() => {
    initDb();
  });

  afterAll(() => {
    db.close();
  });

  it('should create the employees table', () => {
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employees'").get();
    expect(tableInfo).toBeDefined();
    expect(tableInfo.name).toBe('employees');
  });

  it('should create the performance index', () => {
    const indexInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_employees_country_job_title'").get();
    expect(indexInfo).toBeDefined();
    expect(indexInfo.name).toBe('idx_employees_country_job_title');
  });

  it('should deterministically seed mock name combinations', () => {
    const mockFirsts = ['Alice', 'Bob'];
    const mockLasts = ['Smith', 'Jones'];

    const stats = seedDb(mockFirsts, mockLasts);
    expect(stats.count).toBe(4);

    const countRow = db.prepare('SELECT COUNT(*) as count FROM employees').get();
    expect(countRow.count).toBe(4);
  });
});
