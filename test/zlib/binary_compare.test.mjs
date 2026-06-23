import { describe, it } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import { deflate, deflateRaw, gzip } from '../../index.mjs';
import { loadSamples } from '../helpers.mjs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sample = loadSamples().lorem_en_100k;
const buf    = Buffer.from(sample);


// pako `legacyHash` output must match canonical zlib (pre-chromium node.js)
// fixtures byte-for-byte.
describe('Deflate vs canonical zlib snapshots (legacyHash)', () => {

  function testSample(pako_method, sample, options, filename) {
    const dir = path.join(__dirname, 'zlib_snapshots');

    const pako_result = pako_method(sample, Object.assign({ legacyHash: true }, options));
    const zlib_result = fs.readFileSync(path.join(dir, filename));

    // One more hack: gzip header contains OS code, that can vary.
    // Override OS code if requested. For simplicity, we assume it on fixed
    // position (= no additional gzip headers used)
    if (options.ignore_os) zlib_result[9] = pako_result[9];

    assert.deepStrictEqual(pako_result, new Uint8Array(zlib_result));
  }


  describe('Deflate defaults', () => {

    it('deflate, no options', () => {
      testSample(deflate, sample, {}, 'deflate.bin');
    });

    it('deflate raw, no options', () => {
      testSample(deflateRaw, sample, {}, 'deflateRaw.bin');
    });

    // OS code in header can vary. Use hack flag to ignore it.
    it('gzip, no options', () => {
      testSample(gzip, sample, { ignore_os: true }, 'gzip.bin');
    });
  });


  describe('Deflate levels', () => {

    for (const level of [ 9, 8, 7, 6, 5, 4, 3, 2, 1, -1 ]) {
      it(`level ${level}`, () => {
        testSample(deflate, sample, { level }, `deflate_level=${level}.bin`);
      });
    }
  });


  describe('Deflate windowBits', () => {

    for (const windowBits of [ 15, 14, 13, 12, 11, 10, 9, 8 ]) {
      it(`windowBits ${windowBits}`, () => {
        testSample(deflate, sample, { windowBits }, `deflate_windowBits=${windowBits}.bin`);
      });
    }
    it('windowBits -15 (implicit raw)', () => {
      testSample(deflate, sample, { windowBits: -15 }, 'deflateRaw_windowBits=15.bin');
    });

  });


  describe('Deflate memLevel', () => {

    for (const memLevel of [ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]) {
      it(`memLevel ${memLevel}`, () => {
        testSample(deflate, sample, { memLevel }, `deflate_memLevel=${memLevel}.bin`);
      });
    }

  });


  describe('Deflate strategy', () => {

    it('Z_DEFAULT_STRATEGY', () => {
      testSample(deflate, sample, { strategy: 0 }, 'deflate_strategy=0.bin');
    });
    it('Z_FILTERED', () => {
      testSample(deflate, sample, { strategy: 1 }, 'deflate_strategy=1.bin');
    });
    it('Z_HUFFMAN_ONLY', () => {
      testSample(deflate, sample, { strategy: 2 }, 'deflate_strategy=2.bin');
    });
    it('Z_RLE', () => {
      testSample(deflate, sample, { strategy: 3 }, 'deflate_strategy=3.bin');
    });
    it('Z_FIXED', () => {
      testSample(deflate, sample, { strategy: 4 }, 'deflate_strategy=4.bin');
    });

  });


  describe('Deflate RAW', () => {
    // Since difference is only in wrapper, test for store/fast/slow methods are enough
    for (const level of [ 4, 1 ]) {
      it(`level ${level}`, () => {
        testSample(deflateRaw, sample, { level }, `deflateRaw_level=${level}.bin`);
      });
    }

  });


  describe('Deflate dictionary', () => {

    it('trivial dictionary', () => {
      const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
      testSample(deflate, sample, { dictionary: dict }, 'deflate_dictionary=trivial.bin');
    });

    it('spdy dictionary', () => {
      const spdyDict = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'spdy_dict.txt'));

      testSample(deflate, sample, { dictionary: spdyDict }, 'deflate_dictionary=spdy.bin');
    });
  });
});


// pako's ANZAC++ hash (legacyHash: false) matches node.js zlib output. Validate
// against the running node directly, so no fixtures are needed.
describe('Deflate vs node.js zlib (ANZAC++ hash)', () => {

  function testNode(pako_result, node_result, ignore_os) {
    node_result = Buffer.from(node_result);
    // gzip header contains OS code, that can vary. Override it if requested.
    if (ignore_os) node_result[9] = pako_result[9];

    assert.deepStrictEqual(pako_result, new Uint8Array(node_result));
  }


  describe('Deflate defaults', () => {

    it('deflate, no options', () => {
      testNode(deflate(sample, { legacyHash: false }), zlib.deflateSync(buf));
    });

    it('deflate raw, no options', () => {
      testNode(deflateRaw(sample, { legacyHash: false }), zlib.deflateRawSync(buf));
    });

    it('gzip, no options', () => {
      testNode(gzip(sample, { legacyHash: false }), zlib.gzipSync(buf), true);
    });
  });


  describe('Deflate levels', () => {

    for (const level of [ 9, 8, 7, 6, 5, 4, 3, 2, 1, -1 ]) {
      it(`level ${level}`, () => {
        testNode(deflate(sample, { level, legacyHash: false }), zlib.deflateSync(buf, { level }));
      });
    }
  });


  describe('Deflate windowBits', () => {

    for (const windowBits of [ 15, 14, 13, 12, 11, 10, 9, 8 ]) {
      it(`windowBits ${windowBits}`, () => {
        testNode(deflate(sample, { windowBits, legacyHash: false }), zlib.deflateSync(buf, { windowBits }));
      });
    }
    it('windowBits -15 (implicit raw)', () => {
      testNode(deflate(sample, { windowBits: -15, legacyHash: false }), zlib.deflateRawSync(buf, { windowBits: 15 }));
    });

  });


  describe('Deflate memLevel', () => {

    for (const memLevel of [ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]) {
      it(`memLevel ${memLevel}`, () => {
        testNode(deflate(sample, { memLevel, legacyHash: false }), zlib.deflateSync(buf, { memLevel }));
      });
    }

  });


  describe('Deflate strategy', () => {

    it('Z_DEFAULT_STRATEGY', () => {
      testNode(deflate(sample, { strategy: 0, legacyHash: false }), zlib.deflateSync(buf, { strategy: 0 }));
    });
    it('Z_FILTERED', () => {
      testNode(deflate(sample, { strategy: 1, legacyHash: false }), zlib.deflateSync(buf, { strategy: 1 }));
    });
    it('Z_HUFFMAN_ONLY', () => {
      testNode(deflate(sample, { strategy: 2, legacyHash: false }), zlib.deflateSync(buf, { strategy: 2 }));
    });
    it('Z_RLE', () => {
      testNode(deflate(sample, { strategy: 3, legacyHash: false }), zlib.deflateSync(buf, { strategy: 3 }));
    });
    it('Z_FIXED', () => {
      testNode(deflate(sample, { strategy: 4, legacyHash: false }), zlib.deflateSync(buf, { strategy: 4 }));
    });

  });


  describe('Deflate RAW', () => {

    for (const level of [ 4, 1 ]) {
      it(`level ${level}`, () => {
        testNode(deflateRaw(sample, { level, legacyHash: false }), zlib.deflateRawSync(buf, { level }));
      });
    }

  });


  describe('Deflate dictionary', () => {

    it('trivial dictionary', () => {
      const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
      testNode(deflate(sample, { dictionary: dict, legacyHash: false }), zlib.deflateSync(buf, { dictionary: dict }));
    });

    it('spdy dictionary', () => {
      const spdyDict = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'spdy_dict.txt'));

      testNode(deflate(sample, { dictionary: spdyDict, legacyHash: false }), zlib.deflateSync(buf, { dictionary: spdyDict }));
    });
  });
});
