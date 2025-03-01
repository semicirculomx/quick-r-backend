const request = require('supertest');
const app = require('../server');

describe('Operadores API', () => {
  it('should get operadores', async () => {
    const res = await request(app).get('/operadores');
    expect(res.statusCode).toEqual(200);
  });
});
