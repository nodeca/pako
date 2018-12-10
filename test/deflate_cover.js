// Deflate coverage tests

/*global describe, it*/

import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

import { Z_OK, Z_STREAM_ERROR, Z_BUF_ERROR, Z_FINISH } from '../lib/zlib/constants';
import msg from '../lib/zlib/messages';
import { deflate, deflateInit, deflateSetHeader, deflateEnd } from '../lib/zlib/deflate';
import ZStream from '../lib/zlib/zstream';

import { Deflate } from '../lib/pako';


var short_sample = 'hello world';
var long_sample = readFileSync(path.join(__dirname, 'fixtures/samples/lorem_en_100k.txt'));

function testDeflate(data, opts, flush) {
  var deflator = new Deflate(opts);
  deflator.push(data, flush);
  deflator.push(data, true);

  assert.equal(deflator.err, false, msg[deflator.err]);
}

describe('Deflate support', function () {
  it('stored', function () {
    testDeflate(short_sample, { level: 0, chunkSize: 200 }, 0);
    testDeflate(short_sample, { level: 0, chunkSize: 10 }, 5);
  });
  it('fast', function () {
    testDeflate(short_sample, { level: 1, chunkSize: 10 }, 5);
    testDeflate(long_sample, { level: 1, memLevel: 1, chunkSize: 10 }, 0);
  });
  it('slow', function () {
    testDeflate(short_sample, { level: 4, chunkSize: 10 }, 5);
    testDeflate(long_sample, { level: 9, memLevel: 1, chunkSize: 10 }, 0);
  });
  it('rle', function () {
    testDeflate(short_sample, { strategy: 3 }, 0);
    testDeflate(short_sample, { strategy: 3, chunkSize: 10 }, 5);
    testDeflate(long_sample, { strategy: 3, chunkSize: 10 }, 0);
  });
  it('huffman', function () {
    testDeflate(short_sample, { strategy: 2 }, 0);
    testDeflate(short_sample, { strategy: 2, chunkSize: 10 }, 5);
    testDeflate(long_sample, { strategy: 2, chunkSize: 10 }, 0);

  });
});

describe('Deflate states', function () {
  //in port checking input parameters was removed
  it('inflate bad parameters', function () {
    var ret, strm;

    ret = deflate(null, 0);
    assert(ret === Z_STREAM_ERROR);

    strm = new ZStream();

    ret = deflateInit(null);
    assert(ret === Z_STREAM_ERROR);

    ret = deflateInit(strm, 6);
    assert(ret === Z_OK);

    ret = deflateSetHeader(null);
    assert(ret === Z_STREAM_ERROR);

    strm.state.wrap = 1;
    ret = deflateSetHeader(strm, null);
    assert(ret === Z_STREAM_ERROR);

    strm.state.wrap = 2;
    ret = deflateSetHeader(strm, null);
    assert(ret === Z_OK);

    ret = deflate(strm, Z_FINISH);
    assert(ret === Z_BUF_ERROR);

    ret = deflateEnd(null);
    assert(ret === Z_STREAM_ERROR);

    //BS_NEED_MORE
    strm.state.status = 5;
    ret = deflateEnd(strm);
    assert(ret === Z_STREAM_ERROR);
  });
});
