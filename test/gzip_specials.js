'use strict';


const fs      = require('fs');
const path    = require('path');
const assert  = require('assert');

const pako    = require('../index');


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Gzip special cases', () => {

  it('Read custom headers', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    const inflator = new pako.Inflate();
    inflator.push(data, true);

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
    inflator.push(deflator.result, true);

    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(inflator.result, data);

    const header = inflator.header;
    assert.strictEqual(header.time, 1234567);
    assert.strictEqual(header.os, 15);
    assert.strictEqual(header.name, 'test name');
    assert.strictEqual(header.comment, 'test comment');
    assert.deepStrictEqual(header.extra, new Uint8Array([ 4, 5, 6 ]));
  });

  it('Read stream with SYNC marks', () => {
    let inflator, strm, _in, len, pos = 0, i = 0;
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined.gz'));

    do {
      len = data.length - pos;
      _in = new Uint8Array(len);
      _in.set(data.subarray(pos, pos + len), 0);

      inflator = new pako.Inflate();
      strm = inflator.strm;
      inflator.push(_in, true);

      assert(!inflator.err, inflator.msg);

      pos += strm.next_in;
      i++;
    } while (strm.avail_in);

    assert(i === 2, 'invalid blobs count');
  });

});
