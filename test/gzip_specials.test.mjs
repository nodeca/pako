import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import zlib from 'zlib';

import {
  Deflate,
  GZheader,
  Inflate,
  gzip,
  ungzip,
  zlibDeflateSetHeader,
  zlibInflateGetHeader,
  Z_OK,
  Z_SYNC_FLUSH
} from '../src/index.ts';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Gzip special cases', () => {

  it('Read custom headers', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    const inflator = new Inflate();
    inflator.onStart = function (strm) {
      this.header = new GZheader();
      assert.strictEqual(zlibInflateGetHeader(strm, this.header), Z_OK);
    };
    inflator.push(data);

    assert.strictEqual(inflator.header.name, 'test name');
    assert.strictEqual(inflator.header.comment, 'test comment');
    assert.strictEqual(a2s(inflator.header.extra), 'test extra');
  });

  it('Write custom headers', () => {
    const data = '           ';

    const deflator = new Deflate({ gzip: true });
    deflator.onStart = function (strm) {
      const header = new GZheader();
      header.hcrc = true;
      header.time = 1234567;
      header.os = 15;
      header.name = 'test name';
      header.comment = 'test comment';
      header.extra = [ 4, 5, 6 ];

      assert.strictEqual(zlibDeflateSetHeader(strm, header), Z_OK);
    };
    deflator.push(data, true);

    const inflator = new Inflate();
    inflator.onStart = function (strm) {
      this.header = new GZheader();
      assert.strictEqual(zlibInflateGetHeader(strm, this.header), Z_OK);
    };
    inflator.push(deflator.result, true);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(Buffer.from(inflator.result).toString(), data);

    const header = inflator.header;
    assert.strictEqual(header.time, 1234567);
    assert.strictEqual(header.os, 15);
    assert.strictEqual(header.name, 'test name');
    assert.strictEqual(header.comment, 'test comment');
    assert.deepStrictEqual(header.extra, new Uint8Array([ 4, 5, 6 ]));
  });

  it('Read header time past the signed 32-bit boundary (2038) as unsigned', () => {
    // RFC 1952: MTIME is an unsigned 32-bit value. Timestamps from 2038-01-19
    // on have bit 31 set and must not be reported as a negative number.
    const time = 0x80000000;

    const deflator = new Deflate({ gzip: true });
    deflator.onStart = function (strm) {
      const header = new GZheader();
      header.time = time;
      zlibDeflateSetHeader(strm, header);
    };
    deflator.push('x', true);

    const inflator = new Inflate();
    inflator.onStart = function (strm) {
      this.header = new GZheader();
      zlibInflateGetHeader(strm, this.header);
    };
    inflator.push(deflator.result);

    assert.strictEqual(inflator.header.time, time);
  });

  it('Read stream with SYNC marks (multistream source, file 1)', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined.gz'));

    assert.deepStrictEqual(
      ungzip(data),
      new Uint8Array(zlib.gunzipSync(data))
    );
  });

  it('Read stream with SYNC marks (multistream source, file 2)', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined-bgzip.gz'));

    assert.deepStrictEqual(
      ungzip(data, { chunkSize: 16384 }),
      new Uint8Array(zlib.gunzipSync(data))
    );
  });

  it('Write with Z_SYNC_FLUSH', () => {
    const deflator = new Deflate({ gzip: true });

    let count = 0;

    deflator.onData = function (chunk) {
      this.chunks.push(chunk);
      count++;
    };

    deflator.push('12345', Z_SYNC_FLUSH);
    deflator.push('67890', true);

    const flushed = deflator.result;
    const normal = gzip('1234567890');

    assert.strictEqual(count, 2);

    assert.deepStrictEqual(ungzip(flushed), ungzip(normal));
    assert.ok(flushed.length > normal.length);
  });

  it('Decode concatenated members split at the exact member boundary', () => {
    const a = zlib.gzipSync(Buffer.from('hello '));
    const b = zlib.gzipSync(Buffer.from('world'));
    const both = Buffer.concat([ a, b ]);

    for (const split of [ a.length - 1, a.length, a.length + 1 ]) {
      const inflator = new Inflate();
      inflator.push(both.subarray(0, split));
      inflator.push(both.subarray(split), true);

      assert.strictEqual(inflator.err, 0, `split at ${split}`);
      assert.strictEqual(Buffer.from(inflator.result).toString(), 'hello world', `split at ${split}`);
    }
  });

  it('Decode one gzip member per push (BGZF-style feeding)', () => {
    const m1 = zlib.gzipSync(Buffer.from('x'.repeat(1000)));
    const m2 = zlib.gzipSync(Buffer.from('y'.repeat(1000)));
    const m3 = zlib.gzipSync(Buffer.from('z'.repeat(1000)));

    const inflator = new Inflate();
    inflator.push(m1);
    inflator.push(m2);
    inflator.push(m3, true);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(
      Buffer.from(inflator.result).toString(),
      'x'.repeat(1000) + 'y'.repeat(1000) + 'z'.repeat(1000)
    );
  });

  it('Decode joined members fed byte by byte', () => {
    for (const fixture of [ 'gzip-joined.gz', 'gzip-joined-bgzip.gz' ]) {
      const data = fs.readFileSync(path.join(__dirname, 'fixtures', fixture));
      const inflator = new Inflate();

      for (let i = 0; i < data.length; i++) {
        inflator.push(data.subarray(i, i + 1));
      }
      inflator.push(new Uint8Array(0), true);

      assert.strictEqual(inflator.err, 0, fixture);
      assert.deepStrictEqual(
        new Uint8Array(inflator.result),
        new Uint8Array(zlib.gunzipSync(data)),
        fixture
      );
    }
  });

  it('Finalize a member that ends at the input boundary once input is complete', () => {
    const member = zlib.gzipSync(Buffer.from('single'));

    const inflator = new Inflate();
    inflator.push(member);

    assert.strictEqual(inflator.ended, false);

    inflator.push(new Uint8Array(0), true);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(Buffer.from(inflator.result).toString(), 'single');
  });

  it('Keep ignoring trailing data after a zlib stream ends at the input boundary', () => {
    const stream = zlib.deflateSync(Buffer.from('plain zlib'));

    const inflator = new Inflate();
    inflator.push(stream);

    // zlib (RFC 1950) has no concatenated form: the stream finalizes on the
    // spot, exactly at the input boundary or not, and later pushes are no-ops.
    assert.strictEqual(inflator.ended, true);

    inflator.push(stream, true);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(Buffer.from(inflator.result).toString(), 'plain zlib');
  });

});
