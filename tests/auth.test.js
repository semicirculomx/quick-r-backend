const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
  it('should login successfully', async () => {
    const res = await request(app).post('/login').send({ username: 'test', password: 'test' });
    expect(res.statusCode).toEqual(200);
  });
});
