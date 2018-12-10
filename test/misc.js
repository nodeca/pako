/*global describe, it*/


import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

import { cmpBuf } from './helpers';
import { deflate, inflate } from '../lib/pako';

describe('ArrayBuffer', function () {

  var file   = path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt');
  var sample = new Uint8Array(readFileSync(file));
  var deflated = deflate(sample);

  it('Deflate ArrayBuffer', function () {
    assert.ok(cmpBuf(deflated, deflate(sample.buffer)));
  });

  it('Inflate ArrayBuffer', function () {
    assert.ok(cmpBuf(sample, inflate(deflated.buffer)));
  });
});
