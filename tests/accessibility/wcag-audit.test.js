const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

test('Accessibility (WCAG AA): public/index.html document structure', () => {
  const htmlPath = path.join(__dirname, '../../public/index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Must have html lang="en"
  assert.ok(/<html[^>]*lang=["']en["']/.test(html), 'Missing <html lang="en">');

  // Must have meta viewport and meta description
  assert.ok(/<meta[^>]*name=["']viewport["']/.test(html), 'Missing viewport meta tag');
  assert.ok(/<meta[^>]*name=["']description["']/.test(html), 'Missing description meta tag');

  // Must have skip link for keyboard navigation
  assert.ok(/href=["']#main-content["']/.test(html), 'Missing skip to main content link');

  // Must have main landmark
  assert.ok(/<main[^>]*id=["']main-content["'][^>]*role=["']main["']/.test(html), 'Missing <main role="main" id="main-content">');

  // Must have header banner landmark
  assert.ok(/<header[^>]*role=["']banner["']/.test(html), 'Missing <header role="banner">');

  // Must have ARIA live alert region for scams
  assert.ok(/role=["']alert["'][^>]*aria-live=["']assertive["']/.test(html), 'Missing alert live region');

  // Must have ARIA log for real-time console
  assert.ok(/role=["']log["'][^>]*aria-live=["']polite["']/.test(html), 'Missing log live region');

  // Must have ARIA progressbar for confidence meter
  assert.ok(/role=["']progressbar["']/.test(html), 'Missing progressbar role on confidence meter');

  // Must have associated form labels
  assert.ok(/<label[^>]*for=["']input-gemini-key["']/.test(html), 'Missing label for input-gemini-key');
  assert.ok(/<input[^>]*id=["']input-gemini-key["']/.test(html), 'Missing input with id input-gemini-key');

  // Must have modal dialog role
  assert.ok(/role=["']dialog["'][^>]*aria-modal=["']true["']/.test(html), 'Missing dialog role on modal');

  // Check language tags for vernacular Hindi/Gujarati text
  assert.ok(/lang=["']hi["']/.test(html), 'Missing lang="hi" on Hindi text block');
});
