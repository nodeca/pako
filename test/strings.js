/*global describe, it*/


'use strict';


var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');

var pako_utils = require('../lib/zlib/utils');
var pako    = require('../index');

var helpers = require('./helpers');
var cmp     = helpers.cmpBuf;


var file = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
var sampleString = fs.readFileSync(file, 'utf8');
var sampleArray  = new Uint8Array(fs.readFileSync(file));


describe('Deflate strings', function () {

  it('Deflate javascript string (utf16) on input', function () {
    assert.ok(cmp(
      pako.deflate(sampleString),
      pako.deflate(sampleArray)
    ));
  });

  it('Deflate with binary string output', function () {
    assert.ok(cmp(
      pako_utils.binstring2buf(pako.deflate(sampleArray, { to: 'string', chunkSize: 99 })),
      pako.deflate(sampleArray)
    ));
  });

});


describe('Inflate strings', function () {
  var deflatedString = pako.deflate(sampleArray, { to: 'string' });
  var deflatedArray  = pako.deflate(sampleArray);

  it('Inflate binary string input', function () {
    assert.ok(cmp(
      pako.inflate(deflatedString),
      pako.inflate(deflatedArray)
    ));
  });

  it('Inflate with javascript string (utf16) output', function () {
    assert.ok(
      pako.inflate(deflatedArray, { to: 'string', chunkSize: 99 }),
      sampleString
    );
  });

});
