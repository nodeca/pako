'use strict';


const zlib        = require('zlib');
const assert      = require('assert');
const fs      = require('fs');
const path    = require('path');

const pako        = require('../index');
const { testInflate, testSamples, loadSamples } = require('./helpers');


const samples = loadSamples();

describe('Inflate defaults', () => {

  it('inflate, no options', () => {
    testInflate(samples, {}, {});
  });

  it('inflate raw, no options', () => {
    testInflate(samples, { raw: true }, { raw: true });
  });

  it('inflate raw from compressed samples', () => {
    const compressed_samples = loadSamples('samples_deflated_raw');
    testSamples(zlib.inflateRawSync, pako.inflateRaw, compressed_samples, {});
  });

});


describe('Inflate ungzip', () => {
  it('with autodetect', () => {
    testInflate(samples, {}, { gzip: true });
  });

  it('with method set directly', () => {
    testInflate(samples, { windowBits: 16 }, { gzip: true });
  });
});


describe('Inflate levels', () => {

  it('level 9', () => {
    testInflate(samples, {}, { level: 9 });
  });
  it('level 8', () => {
    testInflate(samples, {}, { level: 8 });
  });
  it('level 7', () => {
    testInflate(samples, {}, { level: 7 });
  });
  it('level 6', () => {
    testInflate(samples, {}, { level: 6 });
  });
  it('level 5', () => {
    testInflate(samples, {}, { level: 5 });
  });
  it('level 4', () => {
    testInflate(samples, {}, { level: 4 });
  });
  it('level 3', () => {
    testInflate(samples, {}, { level: 3 });
  });
  it('level 2', () => {
    testInflate(samples, {}, { level: 2 });
  });
  it('level 1', () => {
    testInflate(samples, {}, { level: 1 });
  });
  it('level 0', () => {
    testInflate(samples, {}, { level: 0 });
  });

});


describe('Inflate windowBits', () => {

  it('windowBits 15', () => {
    testInflate(samples, {}, { windowBits: 15 });
  });
  it('windowBits 14', () => {
    testInflate(samples, {}, { windowBits: 14 });
  });
  it('windowBits 13', () => {
    testInflate(samples, {}, { windowBits: 13 });
  });
  it('windowBits 12', () => {
    testInflate(samples, {}, { windowBits: 12 });
  });
  it('windowBits 11', () => {
    testInflate(samples, {}, { windowBits: 11 });
  });
  it('windowBits 10', () => {
    testInflate(samples, {}, { windowBits: 10 });
  });
  it('windowBits 9', () => {
    testInflate(samples, {}, { windowBits: 9 });
  });
  it('windowBits 8', () => {
    testInflate(samples, {}, { windowBits: 8 });
  });

});

describe('Inflate strategy', () => {

  it('Z_DEFAULT_STRATEGY', () => {
    testInflate(samples, {}, { strategy: 0 });
  });
  it('Z_FILTERED', () => {
    testInflate(samples, {}, { strategy: 1 });
  });
  it('Z_HUFFMAN_ONLY', () => {
    testInflate(samples, {}, { strategy: 2 });
  });
  it('Z_RLE', () => {
    testInflate(samples, {}, { strategy: 3 });
  });
  it('Z_FIXED', () => {
    testInflate(samples, {}, { strategy: 4 });
  });

});


describe('Inflate RAW', () => {
  // Since difference is only in rwapper, test for store/fast/slow methods are enough
  it('level 9', () => {
    testInflate(samples, { raw: true }, { level: 9, raw: true });
  });
  it('level 8', () => {
    testInflate(samples, { raw: true }, { level: 8, raw: true });
  });
  it('level 7', () => {
    testInflate(samples, { raw: true }, { level: 7, raw: true });
  });
  it('level 6', () => {
    testInflate(samples, { raw: true }, { level: 6, raw: true });
  });
  it('level 5', () => {
    testInflate(samples, { raw: true }, { level: 5, raw: true });
  });
  it('level 4', () => {
    testInflate(samples, { raw: true }, { level: 4, raw: true });
  });
  it('level 3', () => {
    testInflate(samples, { raw: true }, { level: 3, raw: true });
  });
  it('level 2', () => {
    testInflate(samples, { raw: true }, { level: 2, raw: true });
  });
  it('level 1', () => {
    testInflate(samples, { raw: true }, { level: 1, raw: true });
  });
  it('level 0', () => {
    testInflate(samples, { raw: true }, { level: 0, raw: true });
  });

});


describe('Inflate with dictionary', () => {

  it('should throw on the wrong dictionary', () => {
    // const zCompressed = helpers.deflateSync('world', { dictionary: Buffer.from('hello') });
    const zCompressed = new Uint8Array([ 120, 187, 6, 44, 2, 21, 43, 207, 47, 202, 73, 1, 0, 6, 166, 2, 41 ]);

    assert.throws(function () {
      pako.inflate(zCompressed, { dictionary: 'world' });
    }, /need dictionary/);
  });

  it('trivial dictionary', () => {
    const dict = 'abcdefghijklmnoprstuvwxyz';
    testInflate(samples, { dictionary: dict }, { dictionary: dict });
  });

  it('spdy dictionary', () => {
    const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));
    testInflate(samples, { dictionary: spdyDict }, { dictionary: spdyDict });
  });

  it('should throw if directory is not supplied to raw inflate', () => {
    const dict = 'abcdefghijklmnoprstuvwxyz';
    assert.throws(function () {
      testInflate(samples, { raw: true }, { raw: true, dictionary: dict });
    });
  });

  it('tests raw inflate with spdy dictionary', () => {
    const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));
    testInflate(samples, { raw: true, dictionary: spdyDict }, { raw: true, dictionary: spdyDict });
  });

  it('tests dictionary as Uint8Array', () => {
    const dict = new Uint8Array(100);
    for (let i = 0; i < 100; i++) dict[i] = Math.random() * 256;
    testInflate(samples, { dictionary: dict }, { dictionary: dict });
  });

  it('tests dictionary as ArrayBuffer', () => {
    const dict = new Uint8Array(100);
    for (let i = 0; i < 100; i++) dict[i] = Math.random() * 256;
    testInflate(samples, { dictionary: dict.buffer }, { dictionary: dict });
  });
});


describe('pako patches for inflate', () => {

  it('Force use max window size by default', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.deflate'));
    const unpacked = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.txt'));

    assert.deepStrictEqual(pako.inflate(data), new Uint8Array(unpacked));
  });
});
