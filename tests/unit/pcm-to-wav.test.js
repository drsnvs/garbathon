const test = require('node:test');
const assert = require('node:assert');
const { pcmToWav } = require('../../server.js');

test('pcmToWav: converts raw PCM buffer into valid RIFF WAV buffer', () => {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitDepth = 16;
  const rawPcm = Buffer.alloc(4800); // 0.1 second of silence at 24kHz 16-bit mono

  const wav = pcmToWav(rawPcm, sampleRate, numChannels, bitDepth);

  // Check header sizes
  assert.strictEqual(wav.length, 44 + 4800);

  // Check RIFF chunk
  assert.strictEqual(wav.toString('ascii', 0, 4), 'RIFF');
  assert.strictEqual(wav.readUInt32LE(4), 36 + 4800);
  assert.strictEqual(wav.toString('ascii', 8, 12), 'WAVE');

  // Check fmt subchunk
  assert.strictEqual(wav.toString('ascii', 12, 16), 'fmt ');
  assert.strictEqual(wav.readUInt32LE(16), 16); // Subchunk1Size for PCM
  assert.strictEqual(wav.readUInt16LE(20), 1);  // AudioFormat 1 = PCM
  assert.strictEqual(wav.readUInt16LE(22), numChannels);
  assert.strictEqual(wav.readUInt32LE(24), sampleRate);
  assert.strictEqual(wav.readUInt32LE(28), sampleRate * numChannels * (bitDepth / 8)); // ByteRate
  assert.strictEqual(wav.readUInt16LE(32), numChannels * (bitDepth / 8)); // BlockAlign
  assert.strictEqual(wav.readUInt16LE(34), bitDepth);

  // Check data subchunk
  assert.strictEqual(wav.toString('ascii', 36, 40), 'data');
  assert.strictEqual(wav.readUInt32LE(40), 4800);
});

test('pcmToWav: throws TypeError if pcmData is not a Buffer', () => {
  assert.throws(() => {
    pcmToWav('not a buffer');
  }, TypeError);
});
