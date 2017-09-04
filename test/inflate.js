/*global describe, it*/


'use strict';


var zlib        = require('zlib');
var assert      = require('assert');

var pako        = require('../index');
var helpers     = require('./helpers');
var testInflate = helpers.testInflate;


var samples = helpers.loadSamples();

describe('Inflate defaults', function () {

  it('inflate, no options', function () {
    testInflate(samples, {}, {});
  });

  it('inflate raw, no options', function () {
    testInflate(samples, { raw: true }, { raw: true });
  });

  it('inflate raw from compressed samples', function () {
    var compressed_samples = helpers.loadSamples('samples_deflated_raw');
    helpers.testSamples(zlib.inflateRawSync, pako.inflateRaw, compressed_samples, {});
  });

});


describe('Inflate ungzip', function () {
  it('with autodetect', function () {
    testInflate(samples, {}, { gzip: true });
  });

  it('with method set directly', function () {
    testInflate(samples, { windowBits: 16 }, { gzip: true });
  });
});


describe('Inflate levels', function () {

  it('level 9', function () {
    testInflate(samples, {}, { level: 9 });
  });
  it('level 8', function () {
    testInflate(samples, {}, { level: 8 });
  });
  it('level 7', function () {
    testInflate(samples, {}, { level: 7 });
  });
  it('level 6', function () {
    testInflate(samples, {}, { level: 6 });
  });
  it('level 5', function () {
    testInflate(samples, {}, { level: 5 });
  });
  it('level 4', function () {
    testInflate(samples, {}, { level: 4 });
  });
  it('level 3', function () {
    testInflate(samples, {}, { level: 3 });
  });
  it('level 2', function () {
    testInflate(samples, {}, { level: 2 });
  });
  it('level 1', function () {
    testInflate(samples, {}, { level: 1 });
  });
  it('level 0', function () {
    testInflate(samples, {}, { level: 0 });
  });

});


describe('Inflate windowBits', function () {

  it('windowBits 15', function () {
    testInflate(samples, {}, { windowBits: 15 });
  });
  it('windowBits 14', function () {
    testInflate(samples, {}, { windowBits: 14 });
  });
  it('windowBits 13', function () {
    testInflate(samples, {}, { windowBits: 13 });
  });
  it('windowBits 12', function () {
    testInflate(samples, {}, { windowBits: 12 });
  });
  it('windowBits 11', function () {
    testInflate(samples, {}, { windowBits: 11 });
  });
  it('windowBits 10', function () {
    testInflate(samples, {}, { windowBits: 10 });
  });
  it('windowBits 9', function () {
    testInflate(samples, {}, { windowBits: 9 });
  });
  it('windowBits 8', function () {
    testInflate(samples, {}, { windowBits: 8 });
  });

});

describe('Inflate strategy', function () {

  it('Z_DEFAULT_STRATEGY', function () {
    testInflate(samples, {}, { strategy: 0 });
  });
  it('Z_FILTERED', function () {
    testInflate(samples, {}, { strategy: 1 });
  });
  it('Z_HUFFMAN_ONLY', function () {
    testInflate(samples, {}, { strategy: 2 });
  });
  it('Z_RLE', function () {
    testInflate(samples, {}, { strategy: 3 });
  });
  it('Z_FIXED', function () {
    testInflate(samples, {}, { strategy: 4 });
  });

});


describe('Inflate RAW', function () {
  // Since difference is only in rwapper, test for store/fast/slow methods are enough
  it('level 9', function () {
    testInflate(samples, { raw: true }, { level: 9, raw: true });
  });
  it('level 8', function () {
    testInflate(samples, { raw: true }, { level: 8, raw: true });
  });
  it('level 7', function () {
    testInflate(samples, { raw: true }, { level: 7, raw: true });
  });
  it('level 6', function () {
    testInflate(samples, { raw: true }, { level: 6, raw: true });
  });
  it('level 5', function () {
    testInflate(samples, { raw: true }, { level: 5, raw: true });
  });
  it('level 4', function () {
    testInflate(samples, { raw: true }, { level: 4, raw: true });
  });
  it('level 3', function () {
    testInflate(samples, { raw: true }, { level: 3, raw: true });
  });
  it('level 2', function () {
    testInflate(samples, { raw: true }, { level: 2, raw: true });
  });
  it('level 1', function () {
    testInflate(samples, { raw: true }, { level: 1, raw: true });
  });
  it('level 0', function () {
    testInflate(samples, { raw: true }, { level: 0, raw: true });
  });

});


describe('Inflate with dictionary', function () {

  it('should throw on the wrong dictionary', function () {
    // var zCompressed = helpers.deflateSync('world', { dictionary: new Buffer('hello') });
    var zCompressed = new Buffer([ 120, 187, 6, 44, 2, 21, 43, 207, 47, 202, 73, 1, 0, 6, 166, 2, 41 ]);

    assert.throws(function () {
      pako.inflate(zCompressed, { dictionary: new Buffer('world') });
    }, /data error/);
  });

  it('trivial dictionary', function () {
    var dict = new Buffer('abcdefghijklmnoprstuvwxyz');
    testInflate(samples, { dictionary: dict }, { dictionary: dict });
  });

  it('spdy dictionary', function () {
    var spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));

    testInflate(samples, { dictionary: spdyDict }, { dictionary: helpers.spdyDict });
  });

});
