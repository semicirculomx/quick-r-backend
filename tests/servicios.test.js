const request = require('supertest');
const app = require('../server');

describe('Servicios API', () => {
  it('should get servicios', async () => {
    const res = await request(app).get('/servicios');
    expect(res.statusCode).toEqual(200);
  });
});
