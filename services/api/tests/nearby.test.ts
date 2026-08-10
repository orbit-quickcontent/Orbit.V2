import request from 'supertest';
import { app } from '../src/server';

describe('Nearby Partners Endpoint Integration Test', () => {
  it('GET /api/partners/nearby should return 400 for missing query parameters', async () => {
    const res = await request(app).get('/api/partners/nearby');
    expect(res.status).toBe(400);
  });

  it('GET /api/partners/nearby?lat=19.0728&lng=72.8826&radius=5 should respond with valid array structure', async () => {
    const res = await request(app).get(
      '/api/partners/nearby?lat=19.0728&lng=72.8826&radius=10'
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
