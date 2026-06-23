import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const sample = new Uint8Array([ 0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89 ]);

function roundtrip(deflate, inflate) {
  const compressed = deflate(sample);
  const decompressed = inflate(compressed);

  assert.deepStrictEqual(decompressed, sample);
}

describe('dist smoke test', () => {
  it('loads CJS bundle', () => {
    const { deflate, inflate } = require('../dist/pako.cjs.js');

    roundtrip(deflate, inflate);
  });

  it('loads ESM bundle', async () => {
    const { deflate, inflate } = await import('../dist/pako.mjs');

    roundtrip(deflate, inflate);
  });

  it('loads browser UMD bundle', () => {
    const { deflate, inflate } = require('../dist/browser/pako.umd.min.js');

    roundtrip(deflate, inflate);
  });

  it('loads browser ESM bundle', async () => {
    const { deflate, inflate } = await import('../dist/browser/pako.esm.min.mjs');

    roundtrip(deflate, inflate);
  });

  it('loads split browser UMD bundles', () => {
    const { deflate } = require('../dist/browser/pako_deflate.umd.min.js');
    const { inflate } = require('../dist/browser/pako_inflate.umd.min.js');

    roundtrip(deflate, inflate);
  });

  it('loads split browser ESM bundles', async () => {
    const { deflate } = await import('../dist/browser/pako_deflate.esm.min.mjs');
    const { inflate } = await import('../dist/browser/pako_inflate.esm.min.mjs');

    roundtrip(deflate, inflate);
  });
});
