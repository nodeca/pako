'use strict';


const assert = require('assert');
const { loadSamples } = require('./helpers');
const pako = require('../index');


const samples = loadSamples();


function randomBuf(size) {
  const buf = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = Math.round(Math.random() * 256);
  }
  return buf;
}

function testChunk(buf, expected, packer, chunkSize) {
  let i, _in, count, pos, size, expFlushCount;

  let onData = packer.onData;
  let flushCount = 0;

  packer.onData = function () {
    flushCount++;
    onData.apply(this, arguments);
  };

  count = Math.ceil(buf.length / chunkSize);
  pos = 0;
  for (i = 0; i < count; i++) {
    size = (buf.length - pos) < chunkSize ? buf.length - pos : chunkSize;
    _in = new Uint8Array(size);
    _in.set(buf.subarray(pos, pos + size), 0);
    packer.push(_in, i === count - 1);
    pos += chunkSize;
  }

  //expected count of onData calls. 16384 output chunk size
  expFlushCount = Math.ceil(packer.result.length / packer.options.chunkSize);

  assert(!packer.err, 'Packer error: ' + packer.err);
  assert.deepStrictEqual(packer.result, expected);
  assert.strictEqual(flushCount, expFlushCount, 'onData called ' + flushCount + 'times, expected: ' + expFlushCount);
}

describe('Small input chunks', () => {

  it('deflate 100b by 1b chunk', () => {
    const buf = randomBuf(100);
    const deflated = pako.deflate(buf);
    testChunk(buf, deflated, new pako.Deflate(), 1);
  });

  it('deflate 20000b by 10b chunk', () => {
    const buf = randomBuf(20000);
    const deflated = pako.deflate(buf);
    testChunk(buf, deflated, new pako.Deflate(), 10);
  });

  it('inflate 100b result by 1b chunk', () => {
    const buf = randomBuf(100);
    const deflated = pako.deflate(buf);
    testChunk(deflated, buf, new pako.Inflate(), 1);
  });

  it('inflate 20000b result by 10b chunk', () => {
    const buf = randomBuf(20000);
    const deflated = pako.deflate(buf);
    testChunk(deflated, buf, new pako.Inflate(), 10);
  });

});


describe('Dummy push (force end)', () => {

  it('deflate end', () => {
    const data = samples.lorem_utf_100k;

    const deflator = new pako.Deflate();
    deflator.push(data);
    deflator.push([], true);

    assert.deepStrictEqual(deflator.result, pako.deflate(data));
  });

  it('inflate end', () => {
    const data = pako.deflate(samples.lorem_utf_100k);

    const inflator = new pako.Inflate();
    inflator.push(data);

    assert.deepStrictEqual(inflator.result, pako.inflate(data));
  });

});


describe('Edge condition', () => {

  it('should be ok on buffer border', () => {
    let i;
    const data = new Uint8Array(1024 * 16 + 1);

    for (i = 0; i < data.length; i++) {
      data[i] = Math.floor(Math.random() * 255.999);
    }

    const deflated = pako.deflate(data);

    const inflator = new pako.Inflate();

    for (i = 0; i < deflated.length; i++) {
      inflator.push(deflated.subarray(i, i + 1), false);
      assert.ok(!inflator.err, 'Inflate failed with status ' + inflator.err);
    }

    inflator.push(new Uint8Array(0));

    assert.ok(!inflator.err, 'Inflate failed with status ' + inflator.err);
    assert.deepStrictEqual(data, inflator.result);
  });

});
