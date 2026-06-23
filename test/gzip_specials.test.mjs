import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import zlib from 'zlib';

import { Deflate, Inflate, gzip, ungzip } from '../src/index.mjs';
import { Z_SYNC_FLUSH } from '../src/zlib/constants.mjs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Gzip special cases', () => {

  it('Read custom headers', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    const inflator = new Inflate();
    inflator.push(data);

    assert.strictEqual(inflator.header.name, 'test name');
    assert.strictEqual(inflator.header.comment, 'test comment');
    assert.strictEqual(a2s(inflator.header.extra), 'test extra');
  });

  it('Write custom headers', () => {
    const data = '           ';

    const deflator = new Deflate({
      gzip: true,
      header: {
        hcrc: true,
        time: 1234567,
        os: 15,
        name: 'test name',
        comment: 'test comment',
        extra: [ 4, 5, 6 ]
      }
    });
    deflator.push(data, true);

    const inflator = new Inflate({ to: 'string' });
    inflator.push(deflator.result);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(inflator.result, data);

    const header = inflator.header;
    assert.strictEqual(header.time, 1234567);
    assert.strictEqual(header.os, 15);
    assert.strictEqual(header.name, 'test name');
    assert.strictEqual(header.comment, 'test comment');
    assert.deepStrictEqual(header.extra, new Uint8Array([ 4, 5, 6 ]));
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

});
