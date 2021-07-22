'use strict';


const pako    = require('../index');
const { testSamples, loadSamples } = require('./helpers');
const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');


const samples = loadSamples();


describe('Deflate defaults', () => {

  it('deflate, no options', () => {
    testSamples('deflateSync', pako.deflate, samples, {});
  });

  it('deflate raw, no options', () => {
    testSamples('deflateRawSync', pako.deflateRaw, samples, {});
  });

  // OS code in header can vary. Use hack flag to ignore it.
  it('gzip, no options', () => {
    testSamples('gzipSync', pako.gzip, samples, { ignore_os: true });
  });
});


describe('Deflate levels', () => {

  it('level 9', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 9 });
  });
  it('level 8', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 8 });
  });
  it('level 7', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 7 });
  });
  it('level 6', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 6 });
  });
  it('level 5', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 5 });
  });
  it('level 4', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 4 });
  });
  it('level 3', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 3 });
  });
  it('level 2', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 2 });
  });
  it('level 1', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 1 });
  });
  it.skip('level 0', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: 0 });
  });
  it('level -1 (implicit default)', () => {
    testSamples('deflateSync', pako.deflate, samples, { level: -1 });
  });
});


describe('Deflate windowBits', () => {

  it('windowBits 15', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 15 });
  });
  it('windowBits 14', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 14 });
  });
  it('windowBits 13', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 13 });
  });
  it('windowBits 12', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 12 });
  });
  it('windowBits 11', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 11 });
  });
  it('windowBits 10', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 10 });
  });
  it('windowBits 9', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 9 });
  });
  it('windowBits 8', () => {
    testSamples('deflateSync', pako.deflate, samples, { windowBits: 8 });
  });
  it('windowBits -15 (implicit raw)', () => {
    testSamples('deflateRawSync', pako.deflate, samples, { windowBits: -15 });
  });

});


describe('Deflate memLevel', () => {

  it('memLevel 9', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 9 });
  });
  it('memLevel 8', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 8 });
  });
  it('memLevel 7', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 7 });
  });
  it('memLevel 6', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 6 });
  });
  it('memLevel 5', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 5 });
  });
  it('memLevel 4', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 4 });
  });
  it('memLevel 3', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 3 });
  });
  it('memLevel 2', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 2 });
  });
  it('memLevel 1', () => {
    testSamples('deflateSync', pako.deflate, samples, { memLevel: 1 });
  });

});


describe('Deflate strategy', () => {

  it('Z_DEFAULT_STRATEGY', () => {
    testSamples('deflateSync', pako.deflate, samples, { strategy: 0 });
  });
  it('Z_FILTERED', () => {
    testSamples('deflateSync', pako.deflate, samples, { strategy: 1 });
  });
  it('Z_HUFFMAN_ONLY', () => {
    testSamples('deflateSync', pako.deflate, samples, { strategy: 2 });
  });
  it('Z_RLE', () => {
    testSamples('deflateSync', pako.deflate, samples, { strategy: 3 });
  });
  it('Z_FIXED', () => {
    testSamples('deflateSync', pako.deflate, samples, { strategy: 4 });
  });

});


describe('Deflate RAW', () => {
  // Since difference is only in rwapper, test for store/fast/slow methods are enough
  it('level 4', () => {
    testSamples('deflateRawSync', pako.deflateRaw, samples, { level: 4 });
  });
  it('level 1', () => {
    testSamples('deflateRawSync', pako.deflateRaw, samples, { level: 1 });
  });
  it.skip('level 0', () => {
    testSamples('deflateRawSync', pako.deflateRaw, samples, { level: 0 });
  });

});


describe('Deflate dictionary', () => {

  it('trivial dictionary', () => {
    const dict = Buffer.from('abcdefghijklmnoprstuvwxyz');
    testSamples('deflateSync', pako.deflate, samples, { dictionary: dict });
  });

  it('spdy dictionary', () => {
    const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));

    testSamples('deflateSync', pako.deflate, samples, { dictionary: spdyDict });
  });

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
