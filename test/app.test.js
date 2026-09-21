const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
  it('responds with status 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });

  it('returns "Hello World!"', async () => {
    const res = await request(app).get('/');
    expect(res.text).toBe('Hello World!');
  });

  it('returns a text/html content type', async () => {
    const res = await request(app).get('/');
    expect(res.headers['content-type']).toMatch(/text\/html/);
  });
});

describe('unknown routes', () => {
  it('responds with 404 for a route that does not exist', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.statusCode).toBe(404);
  });
});
