'use strict';


const pako    = require('../index');
const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');


describe('Deflate dictionary', () => {

  it('handles multiple pushes', () => {
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
});


describe('Deflate issues', () => {

  it('#78', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures', 'issue_78.bin'));
    const deflatedPakoData = pako.deflate(data, { memLevel: 1 });
    const inflatedPakoData = pako.inflate(deflatedPakoData);

    assert.strictEqual(data.length, inflatedPakoData.length);
  });
});
