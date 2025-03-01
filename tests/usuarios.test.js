const request = require('supertest');
const app = require('../server');

describe('Usuarios API', () => {
  it('should get usuarios', async () => {
    const res = await request(app).get('/usuarios');
    expect(res.statusCode).toEqual(200);
  });
});
