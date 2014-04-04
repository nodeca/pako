/*global describe, it*/


'use strict';


var fs = require('fs');
var path  = require('path');
var assert = require('assert');


var c = require('../lib/zlib/constants');
var pako_utils = require('../lib/zlib/utils');
var pako  = require('../index');


function h2b(hex) {
  return hex.split(' ').map(function(hex) { return parseInt(hex, 16); });
}

function a2s(array) {
  return String.fromCharCode.apply(null, array);
}

function testInflate(hex, wbits, status) {
  var inflator = new pako.Inflate({ windowBits: wbits });
  inflator.push(h2b(hex), true);
  assert.equal(inflator.err, status);
}


describe('Inflate states', function() {
  it('bad gzip method', function() {
    testInflate('1f 8b 0 0', 31, c.Z_DATA_ERROR);
  });
  it('bad gzip flags', function() {
    testInflate('1f 8b 8 80', 31, c.Z_DATA_ERROR);
  });
  it('bad zlib method', function() {
    testInflate('77 85', 15, c.Z_DATA_ERROR);
  });
  it('set window size from header', function() {
    testInflate('8 99', 0, c.Z_OK);
  });
  it('bad zlib window size', function() {
    testInflate('78 9c', 8, c.Z_DATA_ERROR);
  });
  it('check adler32', function() {
    testInflate('78 9c 63 0 0 0 1 0 1', 15, c.Z_OK);
  });
  it('bad header crc', function() {
    testInflate('1f 8b 8 1e 0 0 0 0 0 0 1 0 0 0 0 0 0', 47, c.Z_DATA_ERROR);
  });
  it('check gzip length', function() {
    testInflate('1f 8b 8 2 0 0 0 0 0 0 1d 26 3 0 0 0 0 0 0 0 0 0', 47, c.Z_OK);
  });
  it('bad zlib header check', function() {
    testInflate('78 90', 47, c.Z_DATA_ERROR);
  });
  it('need dictionary', function() {
    testInflate('8 b8 0 0 0 1', 8, c.Z_NEED_DICT);
  });
  it('compute adler32', function() {
    testInflate('78 9c 63 0', 15, c.Z_OK);
  });
});

describe('Inflate cover', function() {
  it('invalid stored block lengths', function() {
    testInflate('0 0 0 0 0', -15, c.Z_DATA_ERROR);
  });
  it('fixed', function() {
    testInflate('3 0', -15, c.Z_OK);
  });
  it('invalid block type', function() {
    testInflate('6', -15, c.Z_DATA_ERROR);
  });
  it('stored', function() {
    testInflate('1 1 0 fe ff 0', -15, c.Z_OK);
  });
  it('too many length or distance symbols', function() {
    testInflate('fc 0 0', -15, c.Z_DATA_ERROR);
  });
  it('invalid code lengths set', function() {
    testInflate('4 0 fe ff', -15, c.Z_DATA_ERROR);
  });
  it('invalid bit length repeat', function() {
    testInflate('4 0 24 49 0', -15, c.Z_DATA_ERROR);
  });
  it('invalid bit length repeat', function() {
    testInflate('4 0 24 e9 ff ff', -15, c.Z_DATA_ERROR);
  });
  it('invalid code -- missing end-of-block', function() {
    testInflate('4 0 24 e9 ff 6d', -15, c.Z_DATA_ERROR);
  });
  it('invalid literal/lengths set', function() {
    testInflate('4 80 49 92 24 49 92 24 71 ff ff 93 11 0', -15, c.Z_DATA_ERROR);
  });
  it('invalid literal/length code', function() {
    testInflate('4 80 49 92 24 49 92 24 f b4 ff ff c3 84', -15, c.Z_DATA_ERROR);
  });
  it('invalid distance code', function() {
    testInflate('2 7e ff ff', -15, c.Z_DATA_ERROR);
  });
  it('invalid distance too far back', function() {
    testInflate('c c0 81 0 0 0 0 0 90 ff 6b 4 0', -15, c.Z_DATA_ERROR);
  });
  it('incorrect data check', function() {
    testInflate('1f 8b 8 0 0 0 0 0 0 0 3 0 0 0 0 1', 47, c.Z_DATA_ERROR);
  });
  it('incorrect length check', function() {
    testInflate('1f 8b 8 0 0 0 0 0 0 0 3 0 0 0 0 0 0 0 0 1', 47, c.Z_DATA_ERROR);
  });
  it('pull 17', function() {
    testInflate('5 c0 21 d 0 0 0 80 b0 fe 6d 2f 91 6c', -15, c.Z_OK);
  });
  it('long code', function() {
    testInflate('5 e0 81 91 24 cb b2 2c 49 e2 f 2e 8b 9a 47 56 9f fb fe ec d2 ff 1f', -15, c.Z_OK);
  });
  it('length extra', function() {
    testInflate('ed c0 1 1 0 0 0 40 20 ff 57 1b 42 2c 4f', -15, c.Z_OK);
  });
  it('long distance and extra', function() {
    testInflate('ed cf c1 b1 2c 47 10 c4 30 fa 6f 35 1d 1 82 59 3d fb be 2e 2a fc f c', -15, c.Z_OK);
  });
  it('window end', function() {
    testInflate('ed c0 81 0 0 0 0 80 a0 fd a9 17 a9 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 6',
      -15, c.Z_OK);
  });
  it('inflate_fast TYPE return', function() {
    testInflate('2 8 20 80 0 3 0', -15, c.Z_OK);
  });
  it('window wrap', function() {
    testInflate('63 18 5 40 c 0', -8, c.Z_OK);
  });
});

describe('Inflate fast', function() {
  it('fast length extra bits', function() {
    testInflate('e5 e0 81 ad 6d cb b2 2c c9 01 1e 59 63 ae 7d ee fb 4d fd b5 35 41 68' +
      ' ff 7f 0f 0 0 0', -8, c.Z_DATA_ERROR);
  });
  it('fast distance extra bits', function() {
    testInflate('25 fd 81 b5 6d 59 b6 6a 49 ea af 35 6 34 eb 8c b9 f6 b9 1e ef 67 49' +
      ' 50 fe ff ff 3f 0 0', -8, c.Z_DATA_ERROR);
  });
  it('fast invalid literal/length code', function() {
    testInflate('1b 7 0 0 0 0 0', -8, c.Z_DATA_ERROR);
  });
  it('fast 2nd level codes and too far back', function() {
    testInflate('d c7 1 ae eb 38 c 4 41 a0 87 72 de df fb 1f b8 36 b1 38 5d ff ff 0', -8, c.Z_DATA_ERROR);
  });
  it('very common case', function() {
    testInflate('63 18 5 8c 10 8 0 0 0 0', -8, c.Z_OK);
  });
  it('contiguous and wrap around window', function() {
    testInflate('63 60 60 18 c9 0 8 18 18 18 26 c0 28 0 29 0 0 0', -8, c.Z_OK);
  });
  it('copy direct from output', function() {
    testInflate('63 0 3 0 0 0 0 0', -8, c.Z_OK);
  });
});

describe('Inflate support', function() {
  it('force window allocation', function() {
    testInflate('63 0', -15, c.Z_OK);
  });
  it('force window replacement', function() {
    testInflate('63 18 5', -15, c.Z_OK);
  });
  it('force split window update', function() {
    testInflate('63 18 68 30 d0 0 0', -15, c.Z_OK);
  });
  it('use fixed blocks', function() {
    testInflate('3 0', -15, c.Z_OK);
  });
});

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