
const request = require('supertest');
const app = require('../src/app');

describe('App Routes', () => {
  describe('GET /', () => {
    test('returns hello message', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.message).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('returns healthy status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /add', () => {
    test('adds two numbers from query params', async () => {
      const res = await request(app).get('/add?a=3&b=7');
      expect(res.statusCode).toBe(200);
      expect(res.body.result).toBe(10);
    });
  });
});