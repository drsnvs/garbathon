const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { app } = require('../../server.js');

let server;
let baseUrl;

test.before(() => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

test('Security: Helmet headers are present (X-Content-Type-Options: nosniff)', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.has('content-security-policy'));
});

test('Security: CORS preflight handles allowed methods and headers', async () => {
  const res = await fetch(`${baseUrl}/api/config`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://example.com',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, x-gemini-api-key'
    }
  });

  assert.ok([200, 204].includes(res.status));
  assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
});

test('Security: Input Sanitization blocks SQL/Command injection attempts in call_id', async () => {
  const res = await fetch(`${baseUrl}/api/analyze-chunk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      call_id: '../../../etc/passwd; DROP TABLE calls;--',
      chunk_index: 1
    })
  });

  // Should safely handle without error and return default safe response
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.is_scam, false);
});
