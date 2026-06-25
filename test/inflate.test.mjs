import { describe, it } from 'node:test';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

import {
  Deflate,
  Inflate,
  deflate,
  deflateRaw,
  inflate,
  inflateRaw,
  ungzip,
  Z_SYNC_FLUSH
} from '../src/index.ts';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


describe('inflate misc', () => {

  it('ignores understated windowBits in the zlib header', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.deflate'));
    const unpacked = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.txt'));

    assert.deepStrictEqual(inflate(data), new Uint8Array(unpacked));
  });

  it('accepts an ArrayBuffer the same as a Uint8Array', () => {
    const sample = new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures/samples/lorem_utf_100k.txt')));
    const deflated = deflate(sample);

    assert.deepStrictEqual(inflate(deflated.buffer), sample);
  });

  it('applies a dictionary early in raw mode', () => {
    const dict = Buffer.from('abcd');

    const deflate = new Deflate({ raw: true, dictionary: dict });
    deflate.push(Buffer.from('hellohello world'), true);
    assert.ok(!deflate.err, 'deflate error: ' + deflate.err);

    const inflate = new Inflate({ raw: true, dictionary: dict });
    inflate.push(Buffer.from(deflate.result), true);
    assert.ok(!inflate.err, 'inflate error: ' + inflate.err);

    assert.strictEqual(Buffer.from(inflate.result).toString(), 'hellohello world');
  });

  it('throws on invalid init options', () => {
    assert.throws(() => new Inflate({ windowBits: 3 }));
  });

  it('forces max window for raw mode when windowBits is 0', () => {
    const data = deflateRaw(Buffer.from('hello'));

    const inflate = new Inflate({ raw: true, windowBits: 0 });
    inflate.push(Buffer.from(data), true);
    assert.ok(!inflate.err, 'inflate error: ' + inflate.err);

    assert.strictEqual(Buffer.from(inflate.result).toString(), 'hello');
  });
});


describe('Inflate emits buffered output on Z_SYNC_FLUSH', () => {

  it('Read with Z_SYNC_FLUSH emits the tail', () => {
    const text = 'hello world hello world';

    // Produce a non-terminated raw deflate stream via node's Z_SYNC_FLUSH
    const def = zlib.createDeflateRaw();
    const comp = [];
    def.on('data', c => comp.push(c));
    def.write(Buffer.from(text));

    return new Promise(resolve => {
      def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
        const buf = new Uint8Array(Buffer.concat(comp));

        const inflator = new Inflate({ raw: true });
        let count = 0;
        const onData = inflator.onData;
        inflator.onData = function () { count++; onData.apply(this, arguments); };

        const ok = inflator.push(buf, Z_SYNC_FLUSH);

        assert.ok(ok);
        assert.ok(!inflator.err, 'inflate error: ' + inflator.err);
        assert.ok(count > 0, 'onData was not called on Z_SYNC_FLUSH');
        assert.strictEqual(Buffer.concat(inflator.chunks.map(Buffer.from)).toString(), text);
        resolve();
      });
    });
  });

  it('Read with Z_SYNC_FLUSH across multiple pushes (no double emit)', () => {
    const def = zlib.createDeflateRaw();
    let seg = [];
    const take = () => { const b = Buffer.concat(seg); seg = []; return new Uint8Array(b); };
    def.on('data', c => seg.push(c));

    return new Promise(resolve => {
      def.write(Buffer.from('AAAA first '));
      def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
        const p1 = take();
        def.write(Buffer.from('BBBB second'));
        def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
          const p2 = take();

          const inflator = new Inflate({ raw: true });
          inflator.push(p1, Z_SYNC_FLUSH);
          inflator.push(p2, Z_SYNC_FLUSH);

          assert.ok(!inflator.err, 'inflate error: ' + inflator.err);
          assert.deepStrictEqual(inflator.chunks.map(chunk => Buffer.from(chunk).toString()), [ 'AAAA first ', 'BBBB second' ]);
          resolve();
        });
      });
    });
  });
});


// What may follow a finished stream depends on the format. Only gzip (RFC 1952)
// defines concatenated members; a zlib stream (RFC 1950) ends after its ADLER32
// and a raw stream (RFC 1951) after its final block, so anything past them -
// another stream, padding, garbage - is not data and must not be decoded.
describe('Inflate trailing data after a complete stream', () => {

  it('gzip file with two members decodes both', () => {
    const data = Buffer.concat([
      zlib.gzipSync(Buffer.from('foo')),
      zlib.gzipSync(Buffer.from('bar'))
    ]);

    assert.strictEqual(Buffer.from(ungzip(data)).toString(), 'foobar');
    assert.deepStrictEqual(ungzip(data), new Uint8Array(zlib.gunzipSync(data)));
  });

  it('anything after the first zlib stream is ignored', () => {
    // tail here is a whole valid second stream - even that is dropped, so any
    // arbitrary trailing bytes are too
    const data = Buffer.concat([
      zlib.deflateSync(Buffer.from('AAA')),
      zlib.deflateSync(Buffer.from('BBB'))
    ]);

    assert.strictEqual(Buffer.from(inflate(data)).toString(), 'AAA');
    assert.deepStrictEqual(inflate(data), new Uint8Array(zlib.inflateSync(data)));
  });

  it('autodetect over zlib: does not loop into trailing data', () => {
    const data = Buffer.concat([
      zlib.deflateSync(Buffer.from('xyz')),
      zlib.deflateSync(Buffer.from('qqq'))
    ]);

    // default options => autodetect (windowBits 47); wrap has the gzip bit set
    // but flags===0 for a zlib member, so the member loop must NOT engage
    const inflator = new Inflate();
    inflator.push(data, true);
    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(Buffer.from(inflator.result).toString(), 'xyz');
  });

  it('gzip zero padding via ArrayBuffer is not misread as a new member', () => {
    const gz = zlib.gzipSync(Buffer.from('padded'));
    const padded = Buffer.concat([ gz, Buffer.alloc(8) ]); // trailing zeros
    const ab = padded.buffer.slice(padded.byteOffset, padded.byteOffset + padded.byteLength);

    assert.deepStrictEqual(ungzip(ab), new Uint8Array(zlib.gunzipSync(padded)));
    assert.strictEqual(Buffer.from(ungzip(ab)).toString(), 'padded');
  });
});


// A compressed stream can end before the caller's data does. Once it has ended,
// further pushes are no-ops that report the recorded outcome, not a blanket
// false - so a successful decode keeps returning true while trailing chunks are
// fed, and the delivered result stays intact.
describe('Inflate push after the stream has ended', () => {

  it('extra pushes after a finished stream return true and keep result', () => {
    const stream = zlib.deflateSync(Buffer.from('payload'));
    const garbage = new Uint8Array([ 1, 2, 3, 4, 5 ]);

    const inflator = new Inflate();
    // Stream ends on this chunk, before the caller's data runs out.
    assert.strictEqual(inflator.push(stream), true);
    assert.strictEqual(inflator.ended, true);
    assert.strictEqual(inflator.err, 0);

    // Trailing chunks the caller didn't know were past the end.
    assert.strictEqual(inflator.push(garbage), true);
    assert.strictEqual(inflator.push(garbage, true), true);

    assert.strictEqual(Buffer.from(inflator.result).toString(), 'payload');
    assert.strictEqual(inflator.err, 0);
  });

  it('pushes after a failed stream keep returning false', () => {
    const full = zlib.deflateSync(Buffer.from('some longer payload to truncate'));
    const trunc = full.subarray(0, full.length - 5);

    const inflator = new Inflate();
    assert.strictEqual(inflator.push(trunc, true), false);
    assert.notStrictEqual(inflator.err, 0);

    assert.strictEqual(inflator.push(new Uint8Array([ 1, 2, 3 ])), false);
  });
});


// A stream cut off before its terminating marker is incomplete; finalizing it
// must fail rather than return the partial output.
describe('Inflate truncated input', () => {

  const full = zlib.deflateSync(Buffer.from('some longer payload to truncate'));
  const trunc = full.subarray(0, full.length - 5);

  it('one-shot inflate throws on incomplete data', () => {
    assert.throws(() => inflate(trunc));
    assert.throws(() => zlib.inflateSync(trunc)); // node fails on it too
  });

  it('streaming push(..., true) reports an error', () => {
    const inflator = new Inflate();
    const ok = inflator.push(trunc, true);

    assert.strictEqual(ok, false);
    assert.notStrictEqual(inflator.err, 0);
    assert.strictEqual(inflator.result.length, 0);
  });

  it('raw truncated input also throws', () => {
    const fullRaw = zlib.deflateRawSync(Buffer.from('payload that will be cut'));
    const truncRaw = fullRaw.subarray(0, fullRaw.length - 4);

    assert.throws(() => inflateRaw(truncRaw));
    assert.throws(() => zlib.inflateRawSync(truncRaw)); // node fails on it too
  });

  it('complete input still succeeds', () => {
    assert.deepStrictEqual(inflate(full), new Uint8Array(zlib.inflateSync(full)));
  });
});
