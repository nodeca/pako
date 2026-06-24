import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';
import assert from 'assert';

import { deflate, inflate } from '../src/index.ts';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// fromCharCode, but understands right > 0xffff values
function fixedFromCharCode(code) {
  /*jshint bitwise: false*/
  if (code > 0xffff) {
    code -= 0x10000;

    const surrogate1 = 0xd800 + (code >> 10);
    const surrogate2 = 0xdc00 + (code & 0x3ff);

    return String.fromCharCode(surrogate1, surrogate2);
  }
  return String.fromCharCode(code);
}

// Converts array of codes / chars / strings to utf16 string
function a2utf16(arr) {
  let result = '';
  arr.forEach(function (item) {
    if (typeof item === 'string') { result += item; return; }
    result += fixedFromCharCode(item);
  });
  return result;
}


describe('Encode/Decode', () => {

  // Create sample, that contains all types of utf8 (1-4byte) after conversion
  const utf16sample = a2utf16([ 0x1f3b5, 'a', 0x266a, 0x35, 0xe800, 0x10ffff, 0x0fffff ]);

  it('Inflate string output handles utf8 split across chunks', () => {
    const data = inflate(deflate(utf16sample), { to: 'string', chunkSize: 1 });

    assert.strictEqual(data, utf16sample);
  });

});


describe('Deflate/Inflate strings', () => {

  const file = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  const sampleString = fs.readFileSync(file, 'utf8');
  const sampleArray  = new Uint8Array(fs.readFileSync(file));

  it('Deflate javascript string (utf16) on input', () => {
    assert.deepStrictEqual(
      deflate(sampleString),
      deflate(sampleArray)
    );
  });

  it('Inflate with javascript string (utf16) output', () => {
    const deflatedArray  = deflate(sampleArray);
    const data = inflate(deflatedArray, { to: 'string', chunkSize: 99 });

    assert.strictEqual(typeof data, 'string');
    assert.strictEqual(data, sampleString);
  });

});
