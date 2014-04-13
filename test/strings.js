/*global describe, it*/


'use strict';


var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');

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
    var data = pako.deflate(sampleArray, { to: 'string', chunkSize: 99 });

    assert.equal(typeof data, 'string');
    assert.ok(cmp(new Buffer(data, 'binary'), pako.deflate(sampleArray)));
  });

});


describe('Inflate strings', function () {
  var deflatedString = pako.deflate(sampleArray, { to: 'string' });
  var deflatedArray  = pako.deflate(sampleArray);

  it('Inflate binary string input', function () {
    assert.ok(cmp(pako.inflate(deflatedString), pako.inflate(deflatedArray)));
  });

  it('Inflate with javascript string (utf16) output', function () {
    var data = pako.inflate(deflatedArray, { to: 'string', chunkSize: 99 });

    assert.equal(typeof data, 'string');
    assert(data === sampleString);
  });

});
