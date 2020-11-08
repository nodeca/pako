'use strict';


const fs      = require('fs');
const path    = require('path');
const assert  = require('assert');

const pako    = require('../index');

describe('ArrayBuffer', () => {

  const file   = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  const sample = new Uint8Array(fs.readFileSync(file));
  const deflated = pako.deflate(sample);

  it('Deflate ArrayBuffer', () => {
    assert.deepStrictEqual(deflated, pako.deflate(sample.buffer));
  });

  it('Inflate ArrayBuffer', () => {
    assert.deepStrictEqual(sample, pako.inflate(deflated.buffer));
  });
});
