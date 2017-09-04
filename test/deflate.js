/*global describe, it*/


'use strict';


var zlib = require('zlib');

var pako    = require('../index');
var helpers = require('./helpers');
var testSamples = helpers.testSamples;
var assert  = require('assert');
var fs      = require('fs');
var path    = require('path');



var samples = helpers.loadSamples();


describe('Deflate defaults', function () {

  it('deflate, no options', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, {});
  });

  it('deflate raw, no options', function () {
    testSamples(zlib.deflateRawSync, pako.deflateRaw, samples, {});
  });

  // OS code in header can vary. Use hack flag to ignore it.
  it('gzip, no options', function () {
    testSamples(zlib.gzipSync, pako.gzip, samples, { ignore_os: true });
  });
});


describe('Deflate levels', function () {

  it('level 9', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 9 });
  });
  it('level 8', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 8 });
  });
  it('level 7', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 7 });
  });
  it('level 6', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 6 });
  });
  it('level 5', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 5 });
  });
  it('level 4', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 4 });
  });
  it('level 3', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 3 });
  });
  it('level 2', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 2 });
  });
  it('level 1', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 1 });
  });
  it.skip('level 0', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: 0 });
  });
  it('level -1 (implicit default)', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { level: -1 });
  });
});


describe('Deflate windowBits', function () {

  it('windowBits 15', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 15 });
  });
  it('windowBits 14', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 14 });
  });
  it('windowBits 13', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 13 });
  });
  it('windowBits 12', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 12 });
  });
  it('windowBits 11', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 11 });
  });
  it('windowBits 10', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 10 });
  });
  it('windowBits 9', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 9 });
  });
  it('windowBits 8', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { windowBits: 8 });
  });
  it('windowBits -15 (implicit raw)', function () {
    testSamples(zlib.deflateRawSync, pako.deflate, samples, { windowBits: -15 });
  });

});


describe('Deflate memLevel', function () {

  it('memLevel 9', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 9 });
  });
  it('memLevel 8', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 8 });
  });
  it('memLevel 7', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 7 });
  });
  it('memLevel 6', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 6 });
  });
  it('memLevel 5', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 5 });
  });
  it('memLevel 4', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 4 });
  });
  it('memLevel 3', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 3 });
  });
  it('memLevel 2', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 2 });
  });
  it('memLevel 1', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { memLevel: 1 });
  });

});


describe('Deflate strategy', function () {

  it('Z_DEFAULT_STRATEGY', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { strategy: 0 });
  });
  it('Z_FILTERED', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { strategy: 1 });
  });
  it('Z_HUFFMAN_ONLY', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { strategy: 2 });
  });
  it('Z_RLE', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { strategy: 3 });
  });
  it('Z_FIXED', function () {
    testSamples(zlib.deflateSync, pako.deflate, samples, { strategy: 4 });
  });

});


describe('Deflate RAW', function () {
  // Since difference is only in rwapper, test for store/fast/slow methods are enough
  it('level 4', function () {
    testSamples(zlib.deflateRawSync, pako.deflateRaw, samples, { level: 4 });
  });
  it('level 1', function () {
    testSamples(zlib.deflateRawSync, pako.deflateRaw, samples, { level: 1 });
  });
  it.skip('level 0', function () {
    testSamples(zlib.deflateRawSync, pako.deflateRaw, samples, { level: 0 });
  });

});


describe('Deflate dictionary', function () {

  it('trivial dictionary', function () {
    var dict = new Buffer('abcdefghijklmnoprstuvwxyz');
    testSamples(zlib.deflateSync, pako.deflate, samples, { dictionary: dict });
  });

  it('spdy dictionary', function () {
    var spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));

    testSamples(zlib.deflateSync, pako.deflate, samples, { dictionary: spdyDict });
  });

  it('handles multiple pushes', function () {
    var dict = new Buffer('abcd');
    var deflate = new pako.Deflate({ dictionary: dict });

    deflate.push(new Buffer('hello'), false);
    deflate.push(new Buffer('hello'), false);
    deflate.push(new Buffer(' world'), true);

    if (deflate.err) { throw new Error(deflate.err); }

    var uncompressed = pako.inflate(new Buffer(deflate.result), { dictionary: dict });

    if (!helpers.cmpBuf(new Buffer('hellohello world'), uncompressed)) {
      throw new Error('Result not equal for p -> z');
    }
  });
});


describe('Deflate issues', function () {

  it('#78', function () {
    var data = fs.readFileSync(path.join(__dirname, 'fixtures', 'issue_78.bin'));
    var deflatedPakoData = pako.deflate(data, { memLevel: 1 });
    var inflatedPakoData = pako.inflate(deflatedPakoData);

    assert.equal(data.length, inflatedPakoData.length);
  });
});
