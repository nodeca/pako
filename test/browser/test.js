/*global describe, it, pako, assert*/


'use strict';


var size = 100*1000;

var data_bin = Uint8Array ? new Uint8Array(size) : new Array(size);

for (var i=data_bin.length-1; i>=0; i--) { data_bin[i] = (Math.random(256)*256) & 0xff; }


describe('Generic tests', function () {

  it('dummy', function() {
    pako.deflate(data_bin);
  });

  it.skip('levels', function() {
    assert.deepEqual(data_bin, pako.inflate(pako.deflate(data_bin)));
    assert.deepEqual(data_bin, pako.inflate(pako.deflate(data_bin, { level: 0 })));
    assert.deepEqual(data_bin, pako.inflate(pako.deflate(data_bin, { level: 1 })));
  });
});

