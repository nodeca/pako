'use strict';


const { describe, it } = require('node:test');
const pako    = require('../index');
const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');


describe('deflate misc', () => {

  it('handles a dictionary across multiple pushes', () => {
    const dict = Buffer.from('abcd');
    const deflate = new pako.Deflate({ dictionary: dict });

    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from(' world'), true);

    if (deflate.err) { throw new Error(deflate.err); }

    const uncompressed = pako.inflate(Buffer.from(deflate.result), { dictionary: dict });

    assert.deepStrictEqual(
      new Uint8Array(Buffer.from('hellohello world')),
      uncompressed
    );
  });

  it('accepts an ArrayBuffer the same as a Uint8Array', () => {
    const sample = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt')));

    assert.deepStrictEqual(pako.deflate(sample.buffer), pako.deflate(sample));
  });

  it('#78', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures', 'issue_78.bin'));
    const deflatedPakoData = pako.deflate(data, { memLevel: 1 });
    const inflatedPakoData = pako.inflate(deflatedPakoData);

    assert.strictEqual(data.length, inflatedPakoData.length);
  });
});
