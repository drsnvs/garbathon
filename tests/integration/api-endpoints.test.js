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
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(() => {
  return new Promise((resolve) => {
    server.close(resolve);
  });
});

async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json();
  return { status: response.status, headers: response.headers, data };
}

test('GET /health returns 200 OK', async () => {
  const res = await apiRequest('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'healthy');
});

test('GET /api/config returns active simulations and models', async () => {
  const res = await apiRequest('/api/config');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'ok');
  assert.strictEqual(Array.isArray(res.data.simulations), true);
  assert.strictEqual(res.data.simulations.length, 4);
});

test('POST /api/analyze-chunk - Hindi Cyber Police (Chunk 2 triggers Scam Alert)', async () => {
  const res = await apiRequest('/api/analyze-chunk', {
    method: 'POST',
    body: JSON.stringify({
      call_id: 'scam_hindi',
      chunk_index: 2,
      start_time: 3.5,
      end_time: 7.5,
      language_preference: 'hindi'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.is_scam, true);
  assert.strictEqual(res.data.scam_type, 'Digital Arrest');
  assert.ok(res.data.confidence >= 95, `Expected high confidence, got ${res.data.confidence}`);
  assert.ok(res.data.red_flags.includes('Impersonation (Police/CBI/Customs/Bank)'));
  assert.ok(res.data.red_flags.includes('Intimidation/Threats'));
  assert.ok(res.data.spoken_warning_text_hindi.length > 10);
});

test('POST /api/analyze-chunk - Gujarati Digital Arrest (Chunk 2 triggers Gujarati Alert)', async () => {
  const res = await apiRequest('/api/analyze-chunk', {
    method: 'POST',
    body: JSON.stringify({
      call_id: 'scam_gujarati',
      chunk_index: 2,
      start_time: 3.5,
      end_time: 7.5,
      language_preference: 'gujarati'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.is_scam, true);
  assert.strictEqual(res.data.scam_type, 'Digital Arrest');
  assert.ok(res.data.confidence >= 95);
  assert.ok(res.data.spoken_warning_text_gujarati.length > 10);
});

test('POST /api/analyze-chunk - English Bank KYC (Chunk 2 triggers Fake KYC Alert)', async () => {
  const res = await apiRequest('/api/analyze-chunk', {
    method: 'POST',
    body: JSON.stringify({
      call_id: 'scam_english',
      chunk_index: 2,
      start_time: 3.5,
      end_time: 7.5
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.is_scam, true);
  assert.strictEqual(res.data.scam_type, 'Fake KYC');
  assert.ok(res.data.red_flags.includes('Urgency'));
});

test('POST /api/analyze-chunk - STRICT RULE 6: Swiggy Genuine Delivery passes SAFE (Zero False Alarm)', async () => {
  const res = await apiRequest('/api/analyze-chunk', {
    method: 'POST',
    body: JSON.stringify({
      call_id: 'genuine_swiggy',
      chunk_index: 1,
      start_time: 0,
      end_time: 3.5
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.is_scam, false, 'Genuine delivery call MUST NOT be flagged as scam');
  assert.strictEqual(res.data.scam_type, 'None');
  assert.ok(res.data.confidence <= 5, `Expected low confidence <= 5%, got ${res.data.confidence}%`);
  assert.strictEqual(res.data.red_flags.length, 0, 'No red flags should be triggered for genuine delivery');
});

test('POST /api/generate-warning-voice - Generates Hindi Native Audio buffer', async () => {
  const res = await apiRequest('/api/generate-warning-voice', {
    method: 'POST',
    body: JSON.stringify({
      text: 'सावधान! यह एक फर्जी डिजिटल अरेस्ट फ्रॉड कॉल है।',
      language: 'hindi'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.data.audio_base64, 'string');
  assert.ok(res.data.audio_base64.length > 1000);
  assert.strictEqual(res.data.language, 'hindi');
});

test('POST /api/generate-warning-voice - Generates Gujarati Native Audio buffer', async () => {
  const res = await apiRequest('/api/generate-warning-voice', {
    method: 'POST',
    body: JSON.stringify({
      text: 'સાવધાન! આ એક નકલી ડિજિટલ અરેસ્ટ સ્કેમ છે.',
      language: 'gujarati'
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(typeof res.data.audio_base64, 'string');
  assert.ok(res.data.audio_base64.length > 1000);
  assert.strictEqual(res.data.language, 'gujarati');
});

test('POST /api/simulate-sms - Dispatches emergency alert to Daughter (Pooja)', async () => {
  const res = await apiRequest('/api/simulate-sms', {
    method: 'POST',
    body: JSON.stringify({
      recipient_name: 'Daughter (Pooja)',
      recipient_phone: '+91 98765 43210',
      scam_type: 'Digital Arrest',
      confidence: 98
    })
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'DISPATCHED');
  assert.strictEqual(res.data.delivered, true);
  assert.ok(res.data.recipient.includes('Daughter (Pooja)'));
  assert.ok(res.data.message.includes('Digital Arrest'));
});

test('POST /api/set-api-key - Validates API key formatting', async () => {
  // Invalid format test
  const badRes = await apiRequest('/api/set-api-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: 'short' })
  });
  assert.strictEqual(badRes.status, 400);

  // Valid format test
  const goodRes = await apiRequest('/api/set-api-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: 'AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q' })
  });
  assert.strictEqual(goodRes.status, 200);
  assert.strictEqual(goodRes.data.success, true);
});
