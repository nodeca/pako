/*global describe, it*/


'use strict';


var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');

var pako    = require('../index');
var cmp     = require('./helpers').cmpBuf;

describe('ArrayBuffer', function () {

  var file   = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  var sample = new Uint8Array(fs.readFileSync(file));
  var deflated = pako.deflate(sample);

  it('Deflate ArrayBuffer', function () {
    assert.ok(cmp(deflated, pako.deflate(sample.buffer)));
  });

  it('Inflate ArrayBuffer', function () {
    assert.ok(cmp(sample, pako.inflate(deflated.buffer)));
  });
});
