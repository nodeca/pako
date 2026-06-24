// This tests are ported from original zlib

import { describe, it } from 'node:test';
import assert from 'assert';

import {
  GZheader,
  messages,
  Z_DATA_ERROR,
  Z_NEED_DICT,
  Z_OK,
  Z_STREAM_ERROR,
  zlibDeflateSetHeader,
  zlibInflate,
  zlibInflateEnd
} from '../../src/zlib.mjs';
import inflate_table from '../../src/zlib/inftrees.mjs';

import { Deflate, Inflate } from '../../src/index.ts';


function h2b(hex) {
  return hex.split(' ').map(function (hx) { return parseInt(hx, 16); });
}


//step argument from original tests is missing because it have no effect
//we have similar behavior in chunks.js tests
function testInflate(hex, wbits, status) {
  let inflator;
  try {
    inflator = new Inflate({ windowBits: wbits });
  } catch (e) {
    assert(e === messages[status]);
    return;
  }
  inflator.push(new Uint8Array(h2b(hex)));
  assert.strictEqual(inflator.err, status);
}


describe('Inflate states', () => {
  //in port checking input parameters was removed
  it('inflate bad parameters', () => {

    let ret = zlibInflate(null, 0);
    assert(ret === Z_STREAM_ERROR);

    ret = zlibInflateEnd(null);
    assert(ret === Z_STREAM_ERROR);

    //skip: inflateCopy is not implemented
    //ret = zlib_inflate.inflateCopy(null, null);
    //assert(ret == Z_STREAM_ERROR);
  });
  it('bad gzip method', () => {
    testInflate('1f 8b 0 0', 31, Z_DATA_ERROR);
  });
  it('bad gzip flags', () => {
    testInflate('1f 8b 8 80', 31, Z_DATA_ERROR);
  });
  it('bad zlib method', () => {
    testInflate('77 85', 15, Z_DATA_ERROR);
  });
  it('set window size from header', () => {
    testInflate('8 99', 0, Z_OK);
  });
  it('bad zlib window size', () => {
    testInflate('78 9c', 8, Z_DATA_ERROR);
  });
  it('check adler32', () => {
    testInflate('78 9c 63 0 0 0 1 0 1', 15, Z_OK);
  });
  it('bad header crc', () => {
    testInflate('1f 8b 8 1e 0 0 0 0 0 0 1 0 0 0 0 0 0', 47, Z_DATA_ERROR);
  });
  it('check gzip length', () => {
    testInflate('1f 8b 8 2 0 0 0 0 0 0 1d 26 3 0 0 0 0 0 0 0 0 0', 47, Z_OK);
  });
  it('bad zlib header check', () => {
    testInflate('78 90', 47, Z_DATA_ERROR);
  });
  it('need dictionary', () => {
    testInflate('8 b8 0 0 0 1', 8, Z_NEED_DICT);
  });
  it('compute adler32', () => {
    testInflate('78 9c 63 0', 15, Z_OK);
  });
});

describe('Inflate cover', () => {
  it('invalid stored block lengths', () => {
    testInflate('0 0 0 0 0', -15, Z_DATA_ERROR);
  });
  it('fixed', () => {
    testInflate('3 0', -15, Z_OK);
  });
  it('invalid block type', () => {
    testInflate('6', -15, Z_DATA_ERROR);
  });
  it('stored', () => {
    testInflate('1 1 0 fe ff 0', -15, Z_OK);
  });
  it('too many length or distance symbols', () => {
    testInflate('fc 0 0', -15, Z_DATA_ERROR);
  });
  it('invalid code lengths set', () => {
    testInflate('4 0 fe ff', -15, Z_DATA_ERROR);
  });
  it('invalid bit length repeat', () => {
    testInflate('4 0 24 49 0', -15, Z_DATA_ERROR);
  });
  it('invalid bit length repeat', () => {
    testInflate('4 0 24 e9 ff ff', -15, Z_DATA_ERROR);
  });
  it('invalid code -- missing end-of-block', () => {
    testInflate('4 0 24 e9 ff 6d', -15, Z_DATA_ERROR);
  });
  it('invalid literal/lengths set', () => {
    testInflate('4 80 49 92 24 49 92 24 71 ff ff 93 11 0', -15, Z_DATA_ERROR);
  });
  it('invalid literal/length code', () => {
    testInflate('4 80 49 92 24 49 92 24 f b4 ff ff c3 84', -15, Z_DATA_ERROR);
  });
  it('invalid distance code', () => {
    testInflate('2 7e ff ff', -15, Z_DATA_ERROR);
  });
  it('invalid distance too far back', () => {
    testInflate('c c0 81 0 0 0 0 0 90 ff 6b 4 0', -15, Z_DATA_ERROR);
  });
  it('incorrect data check', () => {
    testInflate('1f 8b 8 0 0 0 0 0 0 0 3 0 0 0 0 1', 47, Z_DATA_ERROR);
  });
  it('incorrect length check', () => {
    testInflate('1f 8b 8 0 0 0 0 0 0 0 3 0 0 0 0 0 0 0 0 1', 47, Z_DATA_ERROR);
  });
  it('pull 17', () => {
    testInflate('5 c0 21 d 0 0 0 80 b0 fe 6d 2f 91 6c', -15, Z_OK);
  });
  it('long code', () => {
    testInflate('5 e0 81 91 24 cb b2 2c 49 e2 f 2e 8b 9a 47 56 9f fb fe ec d2 ff 1f', -15, Z_OK);
  });
  it('length extra', () => {
    testInflate('ed c0 1 1 0 0 0 40 20 ff 57 1b 42 2c 4f', -15, Z_OK);
  });
  it('long distance and extra', () => {
    testInflate('ed cf c1 b1 2c 47 10 c4 30 fa 6f 35 1d 1 82 59 3d fb be 2e 2a fc f c', -15, Z_OK);
  });
  it('window end', () => {
    testInflate('ed c0 81 0 0 0 0 80 a0 fd a9 17 a9 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6',
      -15, Z_OK);
  });
  it('inflate_fast TYPE return', () => {
    testInflate('2 8 20 80 0 3 0', -15, Z_OK);
  });
  it('window wrap', () => {
    testInflate('63 18 5 40 c 0', -8, Z_OK);
  });
});

describe('cover trees', () => {
  it('inflate_table not enough errors', () => {
    let ret, bits, next, table = [], lens = [], work = [];
    const DISTS = 2;
    /* we need to call inflate_table() directly in order to manifest not-
     enough errors, since zlib insures that enough is always enough */
    for (bits = 0; bits < 15; bits++) {
      lens[bits] = bits + 1;
    }
    lens[15] = 15;
    next = table;

    ret = inflate_table(DISTS, lens, 0, 16, next, 0, work, { bits: 15 });
    assert(ret === 1);

    next = table;
    ret = inflate_table(DISTS, lens, 0, 16, next, 0, work, { bits: 1 });
    assert(ret === 1);
  });
});

describe('Inflate fast', () => {
  it('fast length extra bits', () => {
    testInflate('e5 e0 81 ad 6d cb b2 2c c9 01 1e 59 63 ae 7d ee fb 4d fd b5 35 41 68' +
      ' ff 7f 0f 0 0 0', -8, Z_DATA_ERROR);
  });
  it('fast distance extra bits', () => {
    testInflate('25 fd 81 b5 6d 59 b6 6a 49 ea af 35 6 34 eb 8c b9 f6 b9 1e ef 67 49' +
      ' 50 fe ff ff 3f 0 0', -8, Z_DATA_ERROR);
  });
  it('fast invalid literal/length code', () => {
    testInflate('1b 7 0 0 0 0 0', -8, Z_DATA_ERROR);
  });
  it('fast 2nd level codes and too far back', () => {
    testInflate('d c7 1 ae eb 38 c 4 41 a0 87 72 de df fb 1f b8 36 b1 38 5d ff ff 0', -8, Z_DATA_ERROR);
  });
  it('very common case', () => {
    testInflate('63 18 5 8c 10 8 0 0 0 0', -8, Z_OK);
  });
  it('contiguous and wrap around window', () => {
    testInflate('63 60 60 18 c9 0 8 18 18 18 26 c0 28 0 29 0 0 0', -8, Z_OK);
  });
  it('copy direct from output', () => {
    testInflate('63 0 3 0 0 0 0 0', -8, Z_OK);
  });
});

describe('Inflate chunked input', () => {
  // Feed compressed stream one byte at a time to exercise state re-entry
  // branches (switch(mode) resume points) and window-wrap copy paths.
  it('byte-by-byte gzip with header', () => {
    const data = new Uint8Array(40000);
    for (let i = 0; i < data.length; i++) data[i] = (i * 2654435761) & 0xff;

    const deflator = new Deflate({ gzip: true, level: 9 });
    deflator.onStart = function (strm) {
      const header = new GZheader();
      header.name = 'chunked';
      header.comment = 'test';
      header.hcrc = true;

      assert.strictEqual(zlibDeflateSetHeader(strm, header), Z_OK);
    };
    deflator.push(data, true);
    assert.strictEqual(deflator.err, 0, messages[deflator.err]);
    const compressed = deflator.result;

    const inflator = new Inflate();
    for (let i = 0; i < compressed.length; i++) {
      inflator.push(compressed.subarray(i, i + 1), i === compressed.length - 1);
    }
    assert.strictEqual(inflator.err, 0, messages[inflator.err]);
    assert.deepStrictEqual(inflator.result, data);
  });
});

describe('Inflate support', () => {
  // `inflatePrime` not implemented
  /*it('prime', function() {
    let ret;
    const strm = new zlib_stream();
    strm.avail_in = 0;
    strm.input = null;

    ret = zlib_inflate.inflateInit(strm);
    assert(ret === Z_OK);

    ret = zlib_inflate.inflatePrime(strm, 5, 31);
    assert(ret === Z_OK);

    ret = zlib_inflate.inflatePrime(strm, -1, 0);
    assert(ret === Z_OK);

    // `inflateSetDictionary` not implemented
    // ret = zlib_inflate.inflateSetDictionary(strm, null, 0);
    // assert(ret === Z_STREAM_ERROR);

    ret = zlibInflateEnd(strm);
    assert(ret === Z_OK);
  });*/
  it('force window allocation', () => {
    testInflate('63 0', -15, Z_OK);
  });
  it('force window replacement', () => {
    testInflate('63 18 5', -15, Z_OK);
  });
  it('force split window update', () => {
    testInflate('63 18 68 30 d0 0 0', -15, Z_OK);
  });
  it('use fixed blocks', () => {
    testInflate('3 0', -15, Z_OK);
  });
  it('bad window size', () => {
    testInflate('', -15, Z_OK);
  });
});
