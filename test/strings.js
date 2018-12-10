/*global describe, it*/

import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

import { cmpBuf } from './helpers';
import { deflate, inflate } from '../lib/pako';
import { utf8border, string2buf, buf2string } from '../lib/utils/strings';

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
  var utf8sample = new Uint8Array(new Buffer(utf16sample));

  it('utf-8 border detect', function () {
    assert.equal(utf8border(utf8sample, 1), 1);
    assert.equal(utf8border(utf8sample, 2), 2);
    assert.equal(utf8border(utf8sample, 3), 3);
    assert.equal(utf8border(utf8sample, 4), 4);

    assert.equal(utf8border(utf8sample, 5), 5);

    assert.equal(utf8border(utf8sample, 6), 5);
    assert.equal(utf8border(utf8sample, 7), 5);
    assert.equal(utf8border(utf8sample, 8), 8);

    assert.equal(utf8border(utf8sample, 9), 9);

    assert.equal(utf8border(utf8sample, 10), 9);
    assert.equal(utf8border(utf8sample, 11), 9);
    assert.equal(utf8border(utf8sample, 12), 12);

    assert.equal(utf8border(utf8sample, 13), 12);
    assert.equal(utf8border(utf8sample, 14), 12);
    assert.equal(utf8border(utf8sample, 15), 12);
    assert.equal(utf8border(utf8sample, 16), 16);

    assert.equal(utf8border(utf8sample, 17), 16);
    assert.equal(utf8border(utf8sample, 18), 16);
    assert.equal(utf8border(utf8sample, 19), 16);
    assert.equal(utf8border(utf8sample, 20), 20);
  });

  it('Encode string to utf8 buf', function () {
    assert.ok(cmpBuf(
      string2buf(utf16sample),
      utf8sample
    ));
  });

  it('Decode utf8 buf to string', function () {
    assert.ok(buf2string(utf8sample), utf16sample);
  });

});


describe('Deflate/Inflate strings', function () {

  var file = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  var sampleString = readFileSync(file, 'utf8');
  var sampleArray  = new Uint8Array(readFileSync(file));

  it('Deflate javascript string (utf16) on input', function () {
    assert.ok(cmpBuf(
      deflate(sampleString),
      deflate(sampleArray)
    ));
  });

  it('Deflate with binary string output', function () {
    var data = deflate(sampleArray, { to: 'string', chunkSize: 99 });

    assert.equal(typeof data, 'string');
    assert.ok(cmpBuf(new Buffer(data, 'binary'), deflate(sampleArray)));
  });

  it('Inflate binary string input', function () {
    var deflatedString = deflate(sampleArray, { to: 'string' });
    var deflatedArray  = deflate(sampleArray);
    assert.ok(cmpBuf(inflate(deflatedString), inflate(deflatedArray)));
  });

  it('Inflate with javascript string (utf16) output', function () {
    var deflatedArray  = deflate(sampleArray);
    var data = inflate(deflatedArray, { to: 'string', chunkSize: 99 });

    assert.equal(typeof data, 'string');
    assert.equal(data, sampleString);
  });

});
