// Deflate coverage tests

import { describe, it } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';

import {
  GZheader,
  messages,
  Z_BUF_ERROR,
  Z_FINISH,
  Z_OK,
  Z_PARTIAL_FLUSH,
  Z_STREAM_ERROR,
  ZStream,
  zlibDeflate,
  zlibDeflateEnd,
  zlibDeflateInit,
  zlibDeflateSetHeader
} from '../../src/zlib.ts';

import { Deflate } from '../../src/index.ts';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


const short_sample = 'hello world';
const long_sample = fs.readFileSync(path.join(__dirname, '..', 'fixtures/samples/lorem_en_100k.txt'));

function testDeflate(data, opts, flush) {
  const deflator = new Deflate(opts);
  deflator.push(data, flush);
  deflator.push(data, true);

  assert.strictEqual(deflator.err, 0, messages[deflator.err]);
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
    const deflator = new Deflate({
      gzip: true,
      memLevel: 1,
      chunkSize: 8
    });
    deflator.onStart = function (strm) {
      const header = new GZheader();
      header.hcrc = true;
      header.name = 'n'.repeat(2000);
      header.comment = 'c'.repeat(2000);
      header.extra = new Uint8Array(2000).fill(7);

      assert.strictEqual(zlibDeflateSetHeader(strm, header), Z_OK);
    };
    deflator.push(long_sample, true);
    assert.strictEqual(deflator.err, 0, messages[deflator.err]);
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
    const deflator = new Deflate({ chunkSize: 10 });
    deflator.push(long_sample, Z_PARTIAL_FLUSH);
    deflator.push(long_sample, true);
    assert.strictEqual(deflator.err, 0, messages[deflator.err]);
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

    ret = zlibDeflate(null, 0);
    assert(ret === Z_STREAM_ERROR);

    strm = new ZStream();

    ret = zlibDeflateInit(null);
    assert(ret === Z_STREAM_ERROR);

    ret = zlibDeflateInit(strm, 6);
    assert(ret === Z_OK);

    ret = zlibDeflateSetHeader(null);
    assert(ret === Z_STREAM_ERROR);

    strm.state.wrap = 1;
    ret = zlibDeflateSetHeader(strm, null);
    assert(ret === Z_STREAM_ERROR);

    strm.state.wrap = 2;
    ret = zlibDeflateSetHeader(strm, null);
    assert(ret === Z_OK);

    ret = zlibDeflate(strm, Z_FINISH);
    assert(ret === Z_BUF_ERROR);

    ret = zlibDeflateEnd(null);
    assert(ret === Z_STREAM_ERROR);

    //BS_NEED_MORE
    strm.state.status = 5;
    ret = zlibDeflateEnd(strm);
    assert(ret === Z_STREAM_ERROR);
  });
});
