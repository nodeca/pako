'use strict';


var fs      = require('fs');
var path    = require('path');
var assert  = require('assert');

var pako    = require('../index');
var strings = require('../lib/utils/strings');

// fromCharCode, but understands right > 0xffff values
function fixedFromCharCode(code) {
  /*jshint bitwise: false*/
  if (code > 0xffff) {
    code -= 0x10000;

    var surrogate1 = 0xd800 + (code >> 10),
        surrogate2 = 0xdc00 + (code & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(code);
}

// Converts array of codes / chars / strings to utf16 string
function a2utf16(arr) {
  var result = '';
  arr.forEach(function (item) {
    if (typeof item === 'string') { result += item; return; }
    result += fixedFromCharCode(item);
  });
  return result;
}


describe('Encode/Decode', function () {

  // Create sample, that contains all types of utf8 (1-4byte) after conversion
  var utf16sample = a2utf16([ 0x1f3b5, 'a', 0x266a, 0x35, 0xe800, 0x10ffff, 0x0fffff ]);
  // use node Buffer internal conversion as "done right"
  var utf8sample = new Uint8Array(Buffer.from(utf16sample));

  it('utf-8 border detect', function () {
    var ub = strings.utf8border;
    assert.strictEqual(ub(utf8sample, 1), 1);
    assert.strictEqual(ub(utf8sample, 2), 2);
    assert.strictEqual(ub(utf8sample, 3), 3);
    assert.strictEqual(ub(utf8sample, 4), 4);

    assert.strictEqual(ub(utf8sample, 5), 5);

    assert.strictEqual(ub(utf8sample, 6), 5);
    assert.strictEqual(ub(utf8sample, 7), 5);
    assert.strictEqual(ub(utf8sample, 8), 8);

    assert.strictEqual(ub(utf8sample, 9), 9);

    assert.strictEqual(ub(utf8sample, 10), 9);
    assert.strictEqual(ub(utf8sample, 11), 9);
    assert.strictEqual(ub(utf8sample, 12), 12);

    assert.strictEqual(ub(utf8sample, 13), 12);
    assert.strictEqual(ub(utf8sample, 14), 12);
    assert.strictEqual(ub(utf8sample, 15), 12);
    assert.strictEqual(ub(utf8sample, 16), 16);

    assert.strictEqual(ub(utf8sample, 17), 16);
    assert.strictEqual(ub(utf8sample, 18), 16);
    assert.strictEqual(ub(utf8sample, 19), 16);
    assert.strictEqual(ub(utf8sample, 20), 20);
  });

  it('Encode string to utf8 buf', function () {
    assert.deepStrictEqual(
      strings.string2buf(utf16sample),
      utf8sample
    );
  });

  it('Decode utf8 buf to string', function () {
    assert.ok(strings.buf2string(utf8sample), utf16sample);
  });

});


describe('Deflate/Inflate strings', function () {

  var file = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  var sampleString = fs.readFileSync(file, 'utf8');
  var sampleArray  = new Uint8Array(fs.readFileSync(file));

  it('Deflate javascript string (utf16) on input', function () {
    assert.deepStrictEqual(
      pako.deflate(sampleString),
      pako.deflate(sampleArray)
    );
  });

  it('Inflate with javascript string (utf16) output', function () {
    var deflatedArray  = pako.deflate(sampleArray);
    var data = pako.inflate(deflatedArray, { to: 'string', chunkSize: 99 });

    assert.strictEqual(typeof data, 'string');
    assert.strictEqual(data, sampleString);
  });

});
