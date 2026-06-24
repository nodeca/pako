import { describe, it } from 'node:test';
import {
  Deflate,
  Inflate,
  deflate,
  deflateRaw,
  inflate,
  inflateRaw,
  zlibDeflateSetDictionary,
  Z_FULL_FLUSH,
  Z_OK,
  Z_SYNC_FLUSH
} from '../src/index.ts';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('deflate misc', () => {

  it('handles a dictionary across multiple pushes', () => {
    const dict = Buffer.from('abcd');
    const deflate = new Deflate();
    deflate.onStart = function (strm) {
      assert.strictEqual(zlibDeflateSetDictionary(strm, dict), Z_OK);
    };

    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from(' world'), true);

    if (deflate.err) { throw new Error(deflate.err); }

    const inflate = new Inflate();
    inflate.onNeedDict = function () { return dict; };
    inflate.push(Buffer.from(deflate.result), true);
    assert.ok(!inflate.err, 'inflate error: ' + inflate.err);

    assert.deepStrictEqual(
      new Uint8Array(Buffer.from('hellohello world')),
      inflate.result
    );
  });

  it('accepts an ArrayBuffer the same as a Uint8Array', () => {
    const sample = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt')));

    assert.deepStrictEqual(deflate(sample.buffer), deflate(sample));
  });

  it('sets a dictionary from onStart', () => {
    const dict = new Uint8Array([ 0x61, 0x62, 0x63, 0x64 ]); // 'abcd'

    const withDictionary = new Deflate();
    withDictionary.onStart = function (strm) {
      assert.strictEqual(zlibDeflateSetDictionary(strm, dict), Z_OK);
    };
    withDictionary.push(Buffer.from('hellohello world'), true);
    assert.ok(!withDictionary.err, 'deflate error: ' + withDictionary.err);

    const withoutDictionary = new Deflate();
    withoutDictionary.push(Buffer.from('hellohello world'), true);

    assert.notDeepStrictEqual(withDictionary.result, withoutDictionary.result);

    const inflate = new Inflate();
    inflate.onNeedDict = function () { return dict; };
    inflate.push(Buffer.from(withDictionary.result), true);
    assert.ok(!inflate.err, 'inflate error: ' + inflate.err);
    assert.deepStrictEqual(
      new Uint8Array(Buffer.from('hellohello world')),
      inflate.result
    );
  });

  it('throws on invalid init options', () => {
    assert.throws(() => new Deflate({ level: 42 }));
  });

  it('reports gzip dictionary errors from onStart', () => {
    const deflate = new Deflate({ gzip: true });
    deflate.onStart = function (strm) {
      assert.notStrictEqual(zlibDeflateSetDictionary(strm, Buffer.from('abcd')), Z_OK);
    };
    deflate.push(Buffer.from('hello'), true);
    assert.ok(!deflate.err, 'deflate error: ' + deflate.err);
  });

  it('returns false when pushing after the stream has ended', () => {
    const deflate = new Deflate();
    deflate.push(Buffer.from('hello'), true);

    assert.strictEqual(deflate.push(Buffer.from('world'), true), false);
  });

  it('deflateRaw works without an options argument', () => {
    const raw = deflateRaw(Buffer.from('hello'));

    assert.deepStrictEqual(inflateRaw(raw), new Uint8Array(Buffer.from('hello')));
  });

  // chunkSize 7 leaves avail_out at 5 after the first (non-flushing) push, so
  // the next flush hits the "avail_out <= 6" guard that avoids repeating markers.
  for (const [ name, flush ] of [ [ 'Z_SYNC_FLUSH', Z_SYNC_FLUSH ], [ 'Z_FULL_FLUSH', Z_FULL_FLUSH ] ]) {
    it(`emits a partially filled buffer on ${name} without corrupting output`, () => {
      const deflate = new Deflate({ chunkSize: 7 });

      deflate.push(Buffer.from('hello'), false);
      deflate.push(Buffer.from(' world'), flush);
      deflate.push(Buffer.from('!'), true);

      assert.ok(!deflate.err, 'deflate error: ' + deflate.err);

      const uncompressed = inflate(Buffer.from(deflate.result));
      assert.deepStrictEqual(
        new Uint8Array(Buffer.from('hello world!')),
        uncompressed
      );
    });
  }

  it('round-trips issue #78 sample with memLevel: 1', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures', 'issue_78.bin'));
    const deflatedPakoData = deflate(data, { memLevel: 1 });
    const inflatedPakoData = inflate(deflatedPakoData);

    assert.strictEqual(data.length, inflatedPakoData.length);
  });
});
