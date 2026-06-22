// Deflate coverage tests
'use strict';


const { describe, it } = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path  = require('path');

const c = require('../../lib/zlib/constants');
const msg = require('../../lib/zlib/messages');
const zlib_deflate = require('../../lib/zlib/deflate');
const ZStream = require('../../lib/zlib/zstream');

const pako  = require('../../index');


const short_sample = 'hello world';
const long_sample = fs.readFileSync(path.join(__dirname, '..', 'fixtures/samples/lorem_en_100k.txt'));

function testDeflate(data, opts, flush) {
  const deflator = new pako.Deflate(opts);
  deflator.push(data, flush);
  deflator.push(data, true);

  assert.strictEqual(deflator.err, 0, msg[deflator.err]);
}

describe('Deflate support', () => {
  it('stored', () => {
    testDeflate(short_sample, { level: 0, chunkSize: 200 }, 0);
    testDeflate(short_sample, { level: 0, chunkSize: 10 }, 5);
  });
  it('fast', () => {
    testDeflate(short_sample, { level: 1, chunkSize: 10 }, 5);
    testDeflate(long_sample, { level: 1, memLevel: 1, chunkSize: 10 }, 0);
  });
  it('slow', () => {
    testDeflate(short_sample, { level: 4, chunkSize: 10 }, 5);
    testDeflate(long_sample, { level: 9, memLevel: 1, chunkSize: 10 }, 0);
  });
  it('rle', () => {
    testDeflate(short_sample, { strategy: 3 }, 0);
    testDeflate(short_sample, { strategy: 3, chunkSize: 10 }, 5);
    testDeflate(long_sample, { strategy: 3, chunkSize: 10 }, 0);
  });
  it('huffman', () => {
    testDeflate(short_sample, { strategy: 2 }, 0);
    testDeflate(short_sample, { strategy: 2, chunkSize: 10 }, 5);
    testDeflate(long_sample, { strategy: 2, chunkSize: 10 }, 0);

  });
});

describe('Deflate gzip header', () => {
  // Long header fields + small memLevel force pending-buffer overflow
  // while emitting extra / name / comment, plus hcrc update paths.
  it('long fields overflow pending buffer', () => {
    const deflator = new pako.Deflate({
      gzip: true,
      memLevel: 1,
      chunkSize: 8,
      header: {
        hcrc: true,
        name: 'n'.repeat(2000),
        comment: 'c'.repeat(2000),
        extra: new Uint8Array(2000).fill(7)
      }
    });
    deflator.push(long_sample, true);
    assert.strictEqual(deflator.err, 0, msg[deflator.err]);
  });

  // Exercise level-dependent XFL byte ternaries in the gzip header.
  it('level dependent header byte', () => {
    testDeflate(short_sample, { gzip: true, level: 9 }, 0);
    testDeflate(short_sample, { gzip: true, level: 1 }, 0);
    testDeflate(short_sample, { gzip: true, strategy: 2 }, 0);
  });
});

describe('Deflate flush / data type', () => {
  it('partial flush (_tr_align)', () => {
    const deflator = new pako.Deflate({ chunkSize: 10 });
    deflator.push(long_sample, c.Z_PARTIAL_FLUSH);
    deflator.push(long_sample, true);
    assert.strictEqual(deflator.err, 0, msg[deflator.err]);
  });

  it('binary data type detection', () => {
    const jpeg = fs.readFileSync(path.join(__dirname, '..', 'fixtures/samples/lorem_cat.jpeg'));
    testDeflate(jpeg, { level: 9 }, 0);
  });
});

describe('Deflate states', () => {
  //in port checking input parameters was removed
  it('inflate bad parameters', () => {
    let ret, strm;

    ret = zlib_deflate.deflate(null, 0);
    assert(ret === c.Z_STREAM_ERROR);

    strm = new ZStream();

    ret = zlib_deflate.deflateInit(null);
    assert(ret === c.Z_STREAM_ERROR);

    ret = zlib_deflate.deflateInit(strm, 6);
    assert(ret === c.Z_OK);

    ret = zlib_deflate.deflateSetHeader(null);
    assert(ret === c.Z_STREAM_ERROR);

    strm.state.wrap = 1;
    ret = zlib_deflate.deflateSetHeader(strm, null);
    assert(ret === c.Z_STREAM_ERROR);

    strm.state.wrap = 2;
    ret = zlib_deflate.deflateSetHeader(strm, null);
    assert(ret === c.Z_OK);

    ret = zlib_deflate.deflate(strm, c.Z_FINISH);
    assert(ret === c.Z_BUF_ERROR);

    ret = zlib_deflate.deflateEnd(null);
    assert(ret === c.Z_STREAM_ERROR);

    //BS_NEED_MORE
    strm.state.status = 5;
    ret = zlib_deflate.deflateEnd(strm);
    assert(ret === c.Z_STREAM_ERROR);
  });
});
