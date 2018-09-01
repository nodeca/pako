/*global describe, it*/


'use strict';


var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');
var zlib    = require('zlib');

var pako_utils = require('../lib/utils/common');
var pako    = require('../index');
var cmp     = require('./helpers').cmpBuf;
var constants = require('../lib/zlib/constants');



function a2s(array) {
  return String.fromCharCode.apply(null, array);
}

function readMultiMemberStream(inputData) {
  var inflator, strm, _in, len, pos = 0, i = 0, totalLength = 0;
  var chunks = [], result;
  do {
    len = inputData.length - pos;
    _in = new pako_utils.Buf8(len);
    pako_utils.arraySet(_in, inputData, pos, len, 0);

    inflator = new pako.Inflate();
    strm = inflator.strm;
    inflator.push(_in, constants.Z_SYNC_FLUSH);
    assert(!inflator.err, inflator.msg);

    pos += strm.next_in;
    chunks[i] = inflator.result;
    totalLength += inflator.result.length;
    i++;
  } while (strm.avail_in);

  inflator.push([], constants.Z_FINISH);

  result = new pako_utils.Buf8(totalLength);

  for (i = 0, pos = 0; i < chunks.length; i++) {
    pako_utils.arraySet(result, chunks[i], 0, chunks[i].length, pos);
    pos += chunks[i].length;
  }
  return result;
}

describe('Gzip special cases', function () {

  it('Read custom headers', function () {
    var data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    var inflator = new pako.Inflate();
    inflator.push(data, true);

    assert.equal(inflator.header.name, 'test name');
    assert.equal(inflator.header.comment, 'test comment');
    assert.equal(a2s(inflator.header.extra), 'test extra');
  });

  it('Write custom headers', function () {
    var data = '           ';

    var deflator = new pako.Deflate({
      gzip: true,
      header: {
        hcrc: true,
        time: 1234567,
        os: 15,
        name: 'test name',
        comment: 'test comment',
        extra: [ 4, 5, 6 ]
      }
    });
    deflator.push(data, true);

    var inflator = new pako.Inflate({ to: 'string' });
    inflator.push(deflator.result, true);

    assert.equal(inflator.err, 0);
    assert.equal(inflator.result, data);

    var header = inflator.header;
    assert.equal(header.time, 1234567);
    assert.equal(header.os, 15);
    assert.equal(header.name, 'test name');
    assert.equal(header.comment, 'test comment');
    assert(cmp(header.extra, [ 4, 5, 6 ]));
  });


  it('Read multi-member stream with SYNC marks', function () {
    var inputData = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined.gz'));
    var expectedData = zlib.gunzipSync(inputData, { finishFlush: (zlib.constants || zlib).Z_SYNC_FLUSH });
    var expectedDataArray = new pako_utils.Buf8(expectedData.length);
    pako_utils.arraySet(expectedDataArray, expectedData, 0, expectedData.length, 0);

    var result = readMultiMemberStream(inputData);

    assert.equal(result.length, expectedData.length, 'produces the right amount of data');
    assert.deepEqual(result, expectedDataArray, 'inflator produced expected data');
  });

  it('Read multi-member bgzipped file 1', function () {
    var inputData = fs.readFileSync(path.join(__dirname, 'fixtures/bgzip-1.txt.gz'));
    var expectedData = zlib.gunzipSync(inputData, { finishFlush: (zlib.constants || zlib).Z_SYNC_FLUSH });
    var result = readMultiMemberStream(inputData);

    assert.equal(result.length, 65569, 'decompressed full data');
    assert.deepEqual(result, expectedData, 'get same data as node zlib');
  });

  it('Read multi-member bgzipped file 2', function () {
    var inputData = fs.readFileSync(path.join(__dirname, 'fixtures/bgzip-2.txt.gz'));
    var expectedData = zlib.gunzipSync(inputData, { finishFlush: (zlib.constants || zlib).Z_SYNC_FLUSH });
    var result = readMultiMemberStream(inputData);
    assert.equal(result.length, 1922918, 'decompressed full data');
    assert.deepEqual(result, expectedData, 'get same data as node zlib');
  });
});
