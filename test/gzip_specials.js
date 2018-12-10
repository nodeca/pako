/*global describe, it*/

import { readFileSync } from 'fs';
import path from 'path';
import assert from 'assert';

import { cmpBuf } from './helpers';
import { Deflate, Inflate } from '../lib/pako';
import { arraySet } from '../lib/utils/common';


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Gzip special cases', function () {

  it('Read custom headers', function () {
    var data = readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    var inflator = new Inflate();
    inflator.push(data, true);

    assert.equal(inflator.header.name, 'test name');
    assert.equal(inflator.header.comment, 'test comment');
    assert.equal(a2s(inflator.header.extra), 'test extra');
  });

  it('Write custom headers', function () {
    var data = '           ';

    var deflator = new Deflate({
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

    var inflator = new Inflate({ to: 'string' });
    inflator.push(deflator.result, true);

    assert.equal(inflator.err, 0);
    assert.equal(inflator.result, data);

    var header = inflator.header;
    assert.equal(header.time, 1234567);
    assert.equal(header.os, 15);
    assert.equal(header.name, 'test name');
    assert.equal(header.comment, 'test comment');
    assert(cmpBuf(header.extra, [ 4, 5, 6 ]));
  });

  it('Read stream with SYNC marks', function () {
    var inflator, strm, _in, len, pos = 0, i = 0;
    var data = readFileSync(path.join(__dirname, 'fixtures/gzip-joined.gz'));

    do {
      len = data.length - pos;
      _in = new Uint8Array(len);
      arraySet(_in, data, pos, len, 0);

      inflator = new Inflate();
      strm = inflator.strm;
      inflator.push(_in, true);

      assert(!inflator.err, inflator.msg);

      pos += strm.next_in;
      i++;
    } while (strm.avail_in);

    assert(i === 2, 'invalid blobs count');
  });

});
