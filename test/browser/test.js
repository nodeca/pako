/*global describe, it, pako, assert*/


'use strict';


var size = 100*1000;

var data_bin = (typeof Uint8Array !== 'undefined') ? new Uint8Array(size) : new Array(size);

for (var i=data_bin.length-1; i>=0; i--) { data_bin[i] = (Math.random(256)*256) & 0xff; }

var cmp = function (a, b) {
  if (a.length !== b.length) { return false; }
  for (var i=0, l=a.length; i<l; i++) { if (a[i] !== b[i]) { return false; } }
  return true;
};


describe('Generic', function () {

  it('defaults', function() {
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin))));
  });


  it('levels 0-9', function() {
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 0 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 1 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 2 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 3 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 4 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 5 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 6 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 7 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 8 }))));
    assert(cmp(data_bin, pako.inflate(pako.deflate(data_bin, { level: 9 }))));
  });
});

