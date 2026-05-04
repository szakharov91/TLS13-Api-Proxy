const request = require('supertest');
const app = require('../src/main');

jest.mock('axios');
const axios = require('axios');

const VALID_KEY = 'key1';
const TARGET_URL = 'https://esia.example.com/api';

function authHeaders(extra = {}) {
  return { 'x-client-api-key': VALID_KEY, ...extra };
}

describe('Auth middleware', () => {
  test('rejects request without x-client-api-key', async () => {
    const res = await request(app).post('/esia');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  test('rejects request with unknown key', async () => {
    const res = await request(app)
      .post('/esia')
      .set('x-client-api-key', 'bad-key');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Unauthorized' });
  });

  test('passes request with valid key', async () => {
    axios.post.mockResolvedValueOnce({ status: 200, data: {} });
    const res = await request(app)
      .post('/esia')
      .set(authHeaders({ 'x-target-url': TARGET_URL }));
    expect(res.status).toBe(200);
  });

  test('accepts all configured client keys', async () => {
    const config = require('../src/config');
    for (const key of config.clientKeys) {
      axios.post.mockResolvedValueOnce({ status: 200, data: {} });
      const res = await request(app)
        .post('/esia')
        .set({ 'x-client-api-key': key, 'x-target-url': TARGET_URL });
      expect(res.status).toBe(200);
    }
  });
});

describe('POST /esia', () => {
  test('returns 400 when x-target-url header is missing', async () => {
    const res = await request(app)
      .post('/esia')
      .set(authHeaders());
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing X-Target-URL header' });
  });

  test('proxies request body and authorization header to target', async () => {
    const body = { grant_type: 'client_credentials' };
    const upstreamData = { access_token: 'abc' };
    axios.post.mockResolvedValueOnce({ status: 200, data: upstreamData });

    const res = await request(app)
      .post('/esia')
      .set(authHeaders({ 'x-target-url': TARGET_URL, authorization: 'Bearer token123' }))
      .send(body);

    expect(axios.post).toHaveBeenCalledWith(
      TARGET_URL,
      body,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(upstreamData);
  });

  test('forwards upstream error status and body', async () => {
    const upstreamError = { error: 'invalid_client' };
    const err = new Error('Upstream error');
    err.response = { status: 422, data: upstreamError };
    axios.post.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/esia')
      .set(authHeaders({ 'x-target-url': TARGET_URL }));

    expect(res.status).toBe(422);
    expect(res.body).toEqual(upstreamError);
  });

  test('returns 500 on network-level error', async () => {
    const err = new Error('ECONNREFUSED');
    axios.post.mockRejectedValueOnce(err);

    const res = await request(app)
      .post('/esia')
      .set(authHeaders({ 'x-target-url': TARGET_URL }));

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'ECONNREFUSED' });
  });

  test('proxies empty body when no body is sent', async () => {
    axios.post.mockResolvedValueOnce({ status: 204, data: {} });

    const res = await request(app)
      .post('/esia')
      .set(authHeaders({ 'x-target-url': TARGET_URL }));

    expect(res.status).toBe(204);
  });
});
