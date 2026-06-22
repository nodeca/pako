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

  it('accepts a dictionary passed as ArrayBuffer', () => {
    const dict = new Uint8Array([ 0x61, 0x62, 0x63, 0x64 ]); // 'abcd'

    const fromBuffer = new pako.Deflate({ dictionary: dict.buffer });
    fromBuffer.push(Buffer.from('hellohello world'), true);
    assert.ok(!fromBuffer.err, 'deflate error: ' + fromBuffer.err);

    const fromArray = new pako.Deflate({ dictionary: dict });
    fromArray.push(Buffer.from('hellohello world'), true);

    assert.deepStrictEqual(fromBuffer.result, fromArray.result);

    const uncompressed = pako.inflate(Buffer.from(fromBuffer.result), { dictionary: dict });
    assert.deepStrictEqual(
      new Uint8Array(Buffer.from('hellohello world')),
      uncompressed
    );
  });

  it('throws on invalid init options', () => {
    assert.throws(() => new pako.Deflate({ level: 42 }));
  });

  it('throws when a dictionary is used with gzip (unsupported)', () => {
    assert.throws(() => new pako.Deflate({ gzip: true, dictionary: Buffer.from('abcd') }));
  });

  it('returns false when pushing after the stream has ended', () => {
    const deflate = new pako.Deflate();
    deflate.push(Buffer.from('hello'), true);

    assert.strictEqual(deflate.push(Buffer.from('world'), true), false);
  });

  it('deflateRaw works without an options argument', () => {
    const raw = pako.deflateRaw(Buffer.from('hello'));

    assert.deepStrictEqual(pako.inflateRaw(raw), new Uint8Array(Buffer.from('hello')));
  });

  // chunkSize 7 leaves avail_out at 5 after the first (non-flushing) push, so
  // the next flush hits the "avail_out <= 6" guard that avoids repeating markers.
  for (const flush of [ 'Z_SYNC_FLUSH', 'Z_FULL_FLUSH' ]) {
    it(`emits a partially filled buffer on ${flush} without corrupting output`, () => {
      const deflate = new pako.Deflate({ chunkSize: 7 });

      deflate.push(Buffer.from('hello'), false);
      deflate.push(Buffer.from(' world'), pako.constants[flush]);
      deflate.push(Buffer.from('!'), true);

      assert.ok(!deflate.err, 'deflate error: ' + deflate.err);

      const uncompressed = pako.inflate(Buffer.from(deflate.result));
      assert.deepStrictEqual(
        new Uint8Array(Buffer.from('hello world!')),
        uncompressed
      );
    });
  }

  it('round-trips issue #78 sample with memLevel: 1', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures', 'issue_78.bin'));
    const deflatedPakoData = pako.deflate(data, { memLevel: 1 });
    const inflatedPakoData = pako.inflate(deflatedPakoData);

    assert.strictEqual(data.length, inflatedPakoData.length);
  });
});
