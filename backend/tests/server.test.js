import request from 'supertest';
import app from '../server.js';
import { db } from '../db.js';

describe('Express Health REST API TDD', () => {
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
});
