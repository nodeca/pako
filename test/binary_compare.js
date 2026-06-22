'use strict';

const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');
const zlib    = require('zlib');

const pako        = require('../index');
const loadSamples = require('./helpers').loadSamples;

const sample = loadSamples().lorem_en_100k;
const buf    = Buffer.from(sample);


// pako `legacyHash` output must match canonical zlib (pre-chromium node.js)
// fixtures byte-for-byte.
describe('Deflate vs canonical zlib snapshots (legacyHash)', () => {

  function testSample(pako_method, sample, options, filename) {
    const dir = path.join(__dirname, 'fixtures', 'binary_compare');

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
      testSample(pako.deflate, sample, {}, 'deflate.bin');
    });

    it('deflate raw, no options', () => {
      testSample(pako.deflateRaw, sample, {}, 'deflateRaw.bin');
    });

    // OS code in header can vary. Use hack flag to ignore it.
    it('gzip, no options', () => {
      testSample(pako.gzip, sample, { ignore_os: true }, 'gzip.bin');
    });
  });


  describe('Deflate levels', () => {

    for (const level of [ 9, 8, 7, 6, 5, 4, 3, 2, 1, -1 ]) {
      it(`level ${level}`, () => {
        testSample(pako.deflate, sample, { level }, `deflate_level=${level}.bin`);
      });
    }
  });


  describe('Deflate windowBits', () => {

    for (const windowBits of [ 15, 14, 13, 12, 11, 10, 9, 8 ]) {
      it(`windowBits ${windowBits}`, () => {
        testSample(pako.deflate, sample, { windowBits }, `deflate_windowBits=${windowBits}.bin`);
      });
    }
    it('windowBits -15 (implicit raw)', () => {
      testSample(pako.deflate, sample, { windowBits: -15 }, 'deflateRaw_windowBits=15.bin');
    });

  });


  describe('Deflate memLevel', () => {

    for (const memLevel of [ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]) {
      it(`memLevel ${memLevel}`, () => {
        testSample(pako.deflate, sample, { memLevel }, `deflate_memLevel=${memLevel}.bin`);
      });
    }

  });


  describe('Deflate strategy', () => {

    it('Z_DEFAULT_STRATEGY', () => {
      testSample(pako.deflate, sample, { strategy: 0 }, 'deflate_strategy=0.bin');
    });
    it('Z_FILTERED', () => {
      testSample(pako.deflate, sample, { strategy: 1 }, 'deflate_strategy=1.bin');
    });
    it('Z_HUFFMAN_ONLY', () => {
      testSample(pako.deflate, sample, { strategy: 2 }, 'deflate_strategy=2.bin');
    });
    it('Z_RLE', () => {
      testSample(pako.deflate, sample, { strategy: 3 }, 'deflate_strategy=3.bin');
    });
    it('Z_FIXED', () => {
      testSample(pako.deflate, sample, { strategy: 4 }, 'deflate_strategy=4.bin');
    });

  });


  describe('Deflate RAW', () => {
    // Since difference is only in wrapper, test for store/fast/slow methods are enough
    for (const level of [ 4, 1 ]) {
      it(`level ${level}`, () => {
        testSample(pako.deflateRaw, sample, { level }, `deflateRaw_level=${level}.bin`);
      });
    }

  });


  describe('Deflate dictionary', () => {

    it('trivial dictionary', () => {
      const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
      testSample(pako.deflate, sample, { dictionary: dict }, 'deflate_dictionary=trivial.bin');
    });

    it('spdy dictionary', () => {
      const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));

      testSample(pako.deflate, sample, { dictionary: spdyDict }, 'deflate_dictionary=spdy.bin');
    });
  });
});


// pako's default ANZAC++ hash matches node.js zlib output. Validate against the
// running node directly, so no fixtures are needed.
describe('Deflate vs node.js zlib (default hash)', () => {

  function testNode(pako_result, node_result, ignore_os) {
    node_result = Buffer.from(node_result);
    // gzip header contains OS code, that can vary. Override it if requested.
    if (ignore_os) node_result[9] = pako_result[9];

    assert.deepStrictEqual(pako_result, new Uint8Array(node_result));
  }


  describe('Deflate defaults', () => {

    it('deflate, no options', () => {
      testNode(pako.deflate(sample), zlib.deflateSync(buf));
    });

    it('deflate raw, no options', () => {
      testNode(pako.deflateRaw(sample), zlib.deflateRawSync(buf));
    });

    it('gzip, no options', () => {
      testNode(pako.gzip(sample), zlib.gzipSync(buf), true);
    });
  });


  describe('Deflate levels', () => {

    for (const level of [ 9, 8, 7, 6, 5, 4, 3, 2, 1, -1 ]) {
      it(`level ${level}`, () => {
        testNode(pako.deflate(sample, { level }), zlib.deflateSync(buf, { level }));
      });
    }
  });


  describe('Deflate windowBits', () => {

    for (const windowBits of [ 15, 14, 13, 12, 11, 10, 9, 8 ]) {
      it(`windowBits ${windowBits}`, () => {
        testNode(pako.deflate(sample, { windowBits }), zlib.deflateSync(buf, { windowBits }));
      });
    }
    it('windowBits -15 (implicit raw)', () => {
      testNode(pako.deflate(sample, { windowBits: -15 }), zlib.deflateRawSync(buf, { windowBits: 15 }));
    });

  });


  describe('Deflate memLevel', () => {

    for (const memLevel of [ 9, 8, 7, 6, 5, 4, 3, 2, 1 ]) {
      it(`memLevel ${memLevel}`, () => {
        testNode(pako.deflate(sample, { memLevel }), zlib.deflateSync(buf, { memLevel }));
      });
    }

  });


  describe('Deflate strategy', () => {

    it('Z_DEFAULT_STRATEGY', () => {
      testNode(pako.deflate(sample, { strategy: 0 }), zlib.deflateSync(buf, { strategy: 0 }));
    });
    it('Z_FILTERED', () => {
      testNode(pako.deflate(sample, { strategy: 1 }), zlib.deflateSync(buf, { strategy: 1 }));
    });
    it('Z_HUFFMAN_ONLY', () => {
      testNode(pako.deflate(sample, { strategy: 2 }), zlib.deflateSync(buf, { strategy: 2 }));
    });
    it('Z_RLE', () => {
      testNode(pako.deflate(sample, { strategy: 3 }), zlib.deflateSync(buf, { strategy: 3 }));
    });
    it('Z_FIXED', () => {
      testNode(pako.deflate(sample, { strategy: 4 }), zlib.deflateSync(buf, { strategy: 4 }));
    });

  });


  describe('Deflate RAW', () => {

    for (const level of [ 4, 1 ]) {
      it(`level ${level}`, () => {
        testNode(pako.deflateRaw(sample, { level }), zlib.deflateRawSync(buf, { level }));
      });
    }

  });


  describe('Deflate dictionary', () => {

    it('trivial dictionary', () => {
      const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
      testNode(pako.deflate(sample, { dictionary: dict }), zlib.deflateSync(buf, { dictionary: dict }));
    });

    it('spdy dictionary', () => {
      const spdyDict = fs.readFileSync(path.join(__dirname, 'fixtures', 'spdy_dict.txt'));

      testNode(pako.deflate(sample, { dictionary: spdyDict }), zlib.deflateSync(buf, { dictionary: spdyDict }));
    });
  });
});
