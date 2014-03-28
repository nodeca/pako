/*global describe, it*/


'use strict';

var fs = require('fs');
var path  = require('path');
var assert = require('assert');

var c = require('../lib/zlib/constants');

var pako_utils = require('../lib/zlib/utils');
var pako_msg = require('../lib/zlib/messages');
var pako  = require('../index');

function h2b(hex) {
  var tmp = hex.split(' ');
  var res = new pako_utils.Buf8(tmp.length);
  for (var i=0; i<tmp.length; i++) {
    res[i] = parseInt(tmp[i], 16);
  }

  return res;
}

function testInflate(hex, wbits, err) {
  var inflator;

  var assert_fn = err === c.Z_OK ? assert.doesNotThrow : assert.throws;

  assert_fn(function() {
    inflator = new pako.Inflate({windowBits: wbits});
    inflator.push(h2b(hex), true);
    if (inflator.err) {
      throw new Error(inflator.err);
    }
  }, pako_msg[err]);
}

function testInflateGzHeader(sample, field, expected) {
  var data, actual;
  data = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures/header', sample)));

  var inflator = new pako.Inflate();
  inflator.push(data, true);

  actual = inflator.header[field];
  if (actual instanceof pako_utils.Buf8) {
    actual = String.fromCharCode.apply(null, actual);
  }
  assert.equal(actual, expected);
}


describe('Inflate coverage wrap', function() {
  it('bad gzip method', function() {
    testInflate('1f 8b 0 0', 31, c.Z_DATA_ERROR);
  });
  it('bad gzip flags', function() {
    testInflate('1f 8b 8 80', 31, c.Z_DATA_ERROR);
  });
  it('bad zlib method', function() {
    testInflate('77 85', 15, c.Z_DATA_ERROR);
  });
  it('set window size from header', function() {
    testInflate('8 99', 0, c.Z_OK);
  });
  it('bad zlib window size', function() {
    testInflate('78 9c', 8, c.Z_DATA_ERROR);
  });
  it('check adler32', function() {
    testInflate('78 9c 63 0 0 0 1 0 1', 15, c.Z_OK);
  });
  it('bad header crc', function() {
    testInflate('1f 8b 8 1e 0 0 0 0 0 0 1 0 0 0 0 0 0', 47, c.Z_DATA_ERROR);
  });
  it('check gzip length', function() {
    testInflate('1f 8b 8 2 0 0 0 0 0 0 1d 26 3 0 0 0 0 0 0 0 0 0', 47, c.Z_OK);
  });
  it('bad zlib header check', function() {
    testInflate('78 90', 47, c.Z_DATA_ERROR);
  });
  it('need dictionary', function() {
    testInflate('8 b8 0 0 0 1', 8, c.Z_NEED_DICT);
  });
  it('compute adler32', function() {
    testInflate('78 9c 63 0', 15, c.Z_OK);
  });
});

describe('Inflate coverage gzip header', function() {
  it('check filename', function() {
    testInflateGzHeader('test.gz', 'name', 'test name');
  });
  it('check comment', function() {
    testInflateGzHeader('test.gz', 'comment', 'test comment');
  });
  it('check extra', function() {
    testInflateGzHeader('test.gz', 'extra', 'test extra');
  });
});