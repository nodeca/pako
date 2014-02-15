/*global describe, it*/


'use strict';


var zlib = require('zlib');
var fs   = require('fs');
var path = require('path');


var pako    = require('../index');
var helpers = require('./helpers');
var testDeflate = helpers.testDeflate;


var sample_file = path.join(__dirname, 'fixtures/lorem_100k.txt');
var sample = new Uint8Array(fs.readFileSync(sample_file));


describe('Deflate defaults', function () {

  it.skip('deflate', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, {}, done);
  });

  it.skip('deflate raw', function(done) {
    testDeflate(zlib.createDeflateRaw, pako.deflateRaw, sample, {}, done);
  });

  it('deflate raw (level 0)', function(done) {
    testDeflate(zlib.createDeflateRaw, pako.deflateRaw, sample, { level: 0 }, done);
  });

});


describe('Deflate levels', function () {

  it.skip('level 9', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 9 }, done);
  });
  it.skip('level 8', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 8 }, done);
  });
  it.skip('level 7', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 7 }, done);
  });
  it.skip('level 6', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 6 }, done);
  });
  it.skip('level 5', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 5 }, done);
  });
  it.skip('level 4', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 4 }, done);
  });
  it.skip('level 3', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 3 }, done);
  });
  it.skip('level 2', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 2 }, done);
  });
  it.skip('level 1', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 1 }, done);
  });
  it('level 0', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { level: 0 }, done);
  });

});


describe.skip('Deflate windowBits', function () {

  it('windowBits 16', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 16 }, done);
  });
  it('windowBits 15', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 15 }, done);
  });
  it('windowBits 14', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 14 }, done);
  });
  it('windowBits 13', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 13 }, done);
  });
  it('windowBits 12', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 12 }, done);
  });
  it('windowBits 11', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 11 }, done);
  });
  it('windowBits 10', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 10 }, done);
  });
  it('windowBits 9', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 9 }, done);
  });
  it('windowBits 8', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { windowBits: 8 }, done);
  });

});


describe.skip('Deflate memLevel', function () {

  it('memLevel 9', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 9 }, done);
  });
  it('memLevel 8', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 8 }, done);
  });
  it('memLevel 7', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 7 }, done);
  });
  it('memLevel 6', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 6 }, done);
  });
  it('memLevel 5', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 5 }, done);
  });
  it('memLevel 4', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 4 }, done);
  });
  it('memLevel 3', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 3 }, done);
  });
  it('memLevel 2', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 2 }, done);
  });
  it('memLevel 1', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { memLevel: 1 }, done);
  });

});


describe.skip('Deflate strategy', function () {

  it('Z_DEFAULT_STRATEGY', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { strategy: 0 }, done);
  });
  it('Z_FILTERED', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { strategy: 1 }, done);
  });
  it('Z_HUFFMAN_ONLY', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { strategy: 2 }, done);
  });
  it('Z_RLE', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { strategy: 3 }, done);
  });
  it('Z_FIXED', function(done) {
    testDeflate(zlib.createDeflate, pako.deflate, sample, { strategy: 4 }, done);
  });

});
