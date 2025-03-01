const request = require('supertest');
const app = require('../server');

describe('Pagos API', () => {
  it('should get pagos', async () => {
    const res = await request(app).get('/pagos');
    expect(res.statusCode).toEqual(200);
  });
});
