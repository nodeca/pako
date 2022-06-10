'use strict';


const fs      = require('fs');
const path    = require('path');
const assert  = require('assert');
const zlib    = require('zlib');

const pako    = require('../index');
const { Z_SYNC_FLUSH } = require('../lib/zlib/constants');


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Gzip special cases', () => {

  it('Read custom headers', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    const inflator = new pako.Inflate();
    inflator.push(data);

    assert.strictEqual(inflator.header.name, 'test name');
    assert.strictEqual(inflator.header.comment, 'test comment');
    assert.strictEqual(a2s(inflator.header.extra), 'test extra');
  });

  it('Write custom headers', () => {
    const data = '           ';

    const deflator = new pako.Deflate({
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

    const inflator = new pako.Inflate({ to: 'string' });
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
      pako.ungzip(data),
      new Uint8Array(zlib.gunzipSync(data))
    );
  });

  it.skip('Read stream with SYNC marks (multistream source, file 2)', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined-bgzip.gz'));

    assert.deepStrictEqual(
      // Currently fails with this chunk size
      pako.ungzip(data, { chunkSize: 16384 }),
      new Uint8Array(zlib.gunzipSync(data))
    );
  });

  it('Write with Z_SYNC_FLUSH', () => {
    const deflator = new pako.Deflate({ gzip: true });

    let count = 0;

    deflator.onData = function (chunk) {
      this.chunks.push(chunk);
      count++;
    };

    deflator.push('12345', Z_SYNC_FLUSH);
    deflator.push('67890', true);

    const flushed = deflator.result;
    const normal = pako.gzip('1234567890');

    assert.strictEqual(count, 2);

    assert.deepStrictEqual(pako.ungzip(flushed), pako.ungzip(normal));
    assert.ok(flushed.length > normal.length);
  });

});
