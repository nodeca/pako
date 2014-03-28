/*global describe, it*/


'use strict';


var fs = require('fs');
var path  = require('path');
var assert = require('assert');


var c = require('../lib/zlib/constants');
var pako  = require('../index');


function h2b(hex) {
  return hex.split(' ').map(function(hex) { return parseInt(hex, 16); });
}

function a2s(array) {
  return String.fromCharCode.apply(null, array);
}

function testInflate(hex, wbits, status) {
  var inflator = new pako.Inflate({ windowBits: wbits });
  inflator.push(h2b(hex), true);
  assert.equal(inflator.err, status);
}


describe('Inflate states', function() {
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

describe('Inflate gzip header', function() {
  it('Check headers content from prepared file', function() {
    var data = fs.readFileSync(path.join(__dirname, 'fixtures/header/test.gz'));
    var inflator = new pako.Inflate();
    inflator.push(data, true);

    assert.equal(inflator.header.name, 'test name');
    assert.equal(inflator.header.comment, 'test comment');
    assert.equal(a2s(inflator.header.extra), 'test extra');
  });
});