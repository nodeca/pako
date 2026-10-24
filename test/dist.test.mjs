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
  it('exports compression strategies in full and deflate bundles', async () => {
    const { inflate } = require('../dist/pako.cjs.js');
    const bundles = [
      require('../dist/pako.cjs.js'),
      await import('../dist/pako.mjs'),
      require('../dist/browser/pako.umd.min.js'),
      await import('../dist/browser/pako.esm.min.mjs'),
      require('../dist/browser/pako_deflate.umd.min.js'),
      await import('../dist/browser/pako_deflate.esm.min.mjs')
    ];
    const strategies = {
      Z_DEFAULT_STRATEGY: 0,
      Z_FILTERED: 1,
      Z_HUFFMAN_ONLY: 2,
      Z_RLE: 3,
      Z_FIXED: 4
    };

    for (const bundle of bundles) {
      for (const [name, value] of Object.entries(strategies)) {
        assert.strictEqual(bundle[name], value);
        const compressed = bundle.deflate(sample, { strategy: bundle[name] });
        assert.deepStrictEqual(inflate(compressed), sample);
      }
    }
  });

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
