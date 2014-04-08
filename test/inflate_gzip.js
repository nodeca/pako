/*global describe, it*/


'use strict';


var fs = require('fs');
var path  = require('path');
var assert = require('assert');

var pako_utils = require('../lib/zlib/utils');
var pako  = require('../index');


function a2s(array) {
  return String.fromCharCode.apply(null, array);
}


describe('Inflate gzip header', function() {
  it('Check headers content from prepared file', function() {
    var data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-headers.gz'));
    var inflator = new pako.Inflate();
    inflator.push(data, true);

    assert.equal(inflator.header.name, 'test name');
    assert.equal(inflator.header.comment, 'test comment');
    assert.equal(a2s(inflator.header.extra), 'test extra');
  });
});

describe('Inflate gzip joined', function() {
  it('Check content from prepared file', function() {
    var inflator, strm, _in, len, pos = 0, i = 0;
    var data = fs.readFileSync(path.join(__dirname, 'fixtures/gzip-joined.gz'));

    do {
      len = data.length - pos;
      _in = new pako_utils.Buf8(len);
      pako_utils.arraySet(_in, data, pos, len, 0);

      inflator = new pako.Inflate();
      strm = inflator.strm;
      inflator.push(_in, true);

      assert(!inflator.err, inflator.msg);

      pos += strm.next_in_index;
      i++;
    } while (strm.avail_in);

    assert(i === 2, 'invalid blobs count');
  });
});