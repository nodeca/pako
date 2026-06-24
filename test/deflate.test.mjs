import { describe, it } from 'node:test';
import {
  Deflate,
  Inflate,
  deflate,
  deflateRaw,
  gzip,
  inflate,
  inflateRaw,
  Z_FULL_FLUSH,
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
    const deflate = new Deflate({ dictionary: dict });

    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from('hello'), false);
    deflate.push(Buffer.from(' world'), true);

    if (deflate.err) { throw new Error(deflate.err); }

    const inflate = new Inflate({ dictionary: dict });
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

  it('accepts a dictionary passed as ArrayBuffer', () => {
    const dict = Uint8Array.from('abcd', c => c.charCodeAt(0));

    const compressed = deflate(Buffer.from('hellohello world'), { dictionary: dict.buffer });
    const uncompressed = inflate(compressed, { dictionary: dict });
    assert.deepStrictEqual(
      new Uint8Array(Buffer.from('hellohello world')),
      uncompressed
    );
  });

  it('throws on invalid init options', () => {
    assert.throws(() => new Deflate({ level: 42 }));
  });

  it('throws when a dictionary is used with gzip compression', () => {
    assert.throws(() => new Deflate({ gzip: true, dictionary: Buffer.from('abcd') }), /dictionary is not supported with gzip/);
    assert.throws(() => gzip(Buffer.from('hello'), { dictionary: Buffer.from('abcd') }), /dictionary is not supported with gzip/);
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
