'use strict';


const { describe, it } = require('node:test');
const assert  = require('assert');
const fs      = require('fs');
const path    = require('path');
const zlib    = require('zlib');

const pako    = require('../index');
const { testInflate, loadSamples } = require('./helpers');


const samples = loadSamples();

describe('Inflate defaults', () => {

  it('inflate, no options', () => {
    testInflate(samples, {}, {});
  });

  it('inflate raw, no options', () => {
    testInflate(samples, { raw: true }, { raw: true });
  });

  it('inflate raw from compressed samples', () => {
    Object.values(loadSamples('samples_deflated_raw')).forEach(function (sample) {
      const pako_result = pako.inflateRaw(sample);
      const zlib_result = zlib.inflateRawSync(sample);
      assert.deepStrictEqual(pako_result, new Uint8Array(zlib_result));
    });
  });

});


describe('Inflate ungzip', () => {
  it('with autodetect', () => {
    testInflate(samples, {}, { gzip: true });
  });

  it('with method set directly', () => {
    testInflate(samples, { windowBits: 16 }, { gzip: true });
  });
});


describe('Inflate levels', () => {

  it('level 9', () => {
    testInflate(samples, {}, { level: 9 });
  });
  it('level 8', () => {
    testInflate(samples, {}, { level: 8 });
  });
  it('level 7', () => {
    testInflate(samples, {}, { level: 7 });
  });
  it('level 6', () => {
    testInflate(samples, {}, { level: 6 });
  });
  it('level 5', () => {
    testInflate(samples, {}, { level: 5 });
  });
  it('level 4', () => {
    testInflate(samples, {}, { level: 4 });
  });
  it('level 3', () => {
    testInflate(samples, {}, { level: 3 });
  });
  it('level 2', () => {
    testInflate(samples, {}, { level: 2 });
  });
  it('level 1', () => {
    testInflate(samples, {}, { level: 1 });
  });
  it('level 0', () => {
    testInflate(samples, {}, { level: 0 });
  });

});


describe('Inflate windowBits', () => {

  it('windowBits 15', () => {
    testInflate(samples, {}, { windowBits: 15 });
  });
  it('windowBits 14', () => {
    testInflate(samples, {}, { windowBits: 14 });
  });
  it('windowBits 13', () => {
    testInflate(samples, {}, { windowBits: 13 });
  });
  it('windowBits 12', () => {
    testInflate(samples, {}, { windowBits: 12 });
  });
  it('windowBits 11', () => {
    testInflate(samples, {}, { windowBits: 11 });
  });
  it('windowBits 10', () => {
    testInflate(samples, {}, { windowBits: 10 });
  });
  it('windowBits 9', () => {
    testInflate(samples, {}, { windowBits: 9 });
  });
  it('windowBits 8', () => {
    testInflate(samples, {}, { windowBits: 8 });
  });

});

describe('Inflate strategy', () => {

  it('Z_DEFAULT_STRATEGY', () => {
    testInflate(samples, {}, { strategy: 0 });
  });
  it('Z_FILTERED', () => {
    testInflate(samples, {}, { strategy: 1 });
  });
  it('Z_HUFFMAN_ONLY', () => {
    testInflate(samples, {}, { strategy: 2 });
  });
  it('Z_RLE', () => {
    testInflate(samples, {}, { strategy: 3 });
  });
  it('Z_FIXED', () => {
    testInflate(samples, {}, { strategy: 4 });
  });

});


describe('Inflate RAW', () => {
  // Since difference is only in rwapper, test for store/fast/slow methods are enough
  it('level 9', () => {
    testInflate(samples, { raw: true }, { level: 9, raw: true });
  });
  it('level 8', () => {
    testInflate(samples, { raw: true }, { level: 8, raw: true });
  });
  it('level 7', () => {
    testInflate(samples, { raw: true }, { level: 7, raw: true });
  });
  it('level 6', () => {
    testInflate(samples, { raw: true }, { level: 6, raw: true });
  });
  it('level 5', () => {
    testInflate(samples, { raw: true }, { level: 5, raw: true });
  });
  it('level 4', () => {
    testInflate(samples, { raw: true }, { level: 4, raw: true });
  });
  it('level 3', () => {
    testInflate(samples, { raw: true }, { level: 3, raw: true });
  });
  it('level 2', () => {
    testInflate(samples, { raw: true }, { level: 2, raw: true });
  });
  it('level 1', () => {
    testInflate(samples, { raw: true }, { level: 1, raw: true });
  });
  it('level 0', () => {
    testInflate(samples, { raw: true }, { level: 0, raw: true });
  });

});


describe('Inflate with dictionary', () => {

  it('should throw on the wrong dictionary', () => {
    // const zCompressed = helpers.deflateSync('world', { dictionary: Buffer.from('hello') });
    const zCompressed = new Uint8Array([ 120, 187, 6, 44, 2, 21, 43, 207, 47, 202, 73, 1, 0, 6, 166, 2, 41 ]);

    assert.throws(function () {
      pako.inflate(zCompressed, { dictionary: 'world' });
    }, /need dictionary/);
  });

  it('trivial dictionary', () => {
    const dict = 'abcdefghijklmnoprstuvwxyz';
    testInflate(samples, { dictionary: dict }, { dictionary: dict });
  });

  it('spdy dictionary', () => {
    const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));
    testInflate(samples, { dictionary: spdyDict }, { dictionary: spdyDict });
  });

  it('should throw if directory is not supplied to raw inflate', () => {
    const dict = 'abcdefghijklmnoprstuvwxyz';
    assert.throws(function () {
      testInflate(samples, { raw: true }, { raw: true, dictionary: dict });
    });
  });

  it('tests raw inflate with spdy dictionary', () => {
    const spdyDict = require('fs').readFileSync(require('path').join(__dirname, 'fixtures', 'spdy_dict.txt'));
    testInflate(samples, { raw: true, dictionary: spdyDict }, { raw: true, dictionary: spdyDict });
  });

  it('tests dictionary as Uint8Array', () => {
    const dict = new Uint8Array(100);
    for (let i = 0; i < 100; i++) dict[i] = Math.random() * 256;
    testInflate(samples, { dictionary: dict }, { dictionary: dict });
  });

  it('tests dictionary as ArrayBuffer', () => {
    const dict = new Uint8Array(100);
    for (let i = 0; i < 100; i++) dict[i] = Math.random() * 256;
    testInflate(samples, { dictionary: dict.buffer }, { dictionary: dict });
  });
});


describe('pako patches for inflate', () => {

  it('Force use max window size by default', () => {
    const data = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.deflate'));
    const unpacked = fs.readFileSync(path.join(__dirname, 'fixtures/bad_wbits.txt'));

    assert.deepStrictEqual(pako.inflate(data), new Uint8Array(unpacked));
  });

  it('Read with Z_SYNC_FLUSH emits the tail', () => {
    const text = 'hello world hello world';

    // Produce a non-terminated raw deflate stream via node's Z_SYNC_FLUSH
    const def = zlib.createDeflateRaw();
    const comp = [];
    def.on('data', c => comp.push(c));
    def.write(Buffer.from(text));

    return new Promise(resolve => {
      def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
        const buf = new Uint8Array(Buffer.concat(comp));

        const inflator = new pako.Inflate({ raw: true });
        let count = 0;
        const onData = inflator.onData;
        inflator.onData = function () { count++; onData.apply(this, arguments); };

        const ok = inflator.push(buf, pako.constants.Z_SYNC_FLUSH);

        assert.ok(ok);
        assert.ok(!inflator.err, 'inflate error: ' + inflator.err);
        assert.ok(count > 0, 'onData was not called on Z_SYNC_FLUSH');
        assert.strictEqual(Buffer.concat(inflator.chunks.map(Buffer.from)).toString(), text);
        resolve();
      });
    });
  });

  it('Read with Z_SYNC_FLUSH across multiple pushes (no double emit)', () => {
    const def = zlib.createDeflateRaw();
    let seg = [];
    const take = () => { const b = Buffer.concat(seg); seg = []; return new Uint8Array(b); };
    def.on('data', c => seg.push(c));

    return new Promise(resolve => {
      def.write(Buffer.from('AAAA first '));
      def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
        const p1 = take();
        def.write(Buffer.from('BBBB second'));
        def.flush(zlib.constants.Z_SYNC_FLUSH, () => {
          const p2 = take();

          const inflator = new pako.Inflate({ raw: true, to: 'string' });
          inflator.push(p1, pako.constants.Z_SYNC_FLUSH);
          inflator.push(p2, pako.constants.Z_SYNC_FLUSH);

          assert.ok(!inflator.err, 'inflate error: ' + inflator.err);
          assert.deepStrictEqual(inflator.chunks, [ 'AAAA first ', 'BBBB second' ]);
          resolve();
        });
      });
    });
  });
});


// Only the gzip format defines concatenated members (RFC 1952). A zlib stream
// (RFC 1950) ends after its ADLER32 and a raw stream (RFC 1951) after its final
// block, so nothing may follow them - trailing bytes are not part of the data
// and must not be decoded.
describe('Inflate concatenated members', () => {

  it('gzip file with two members decodes both', () => {
    const data = Buffer.concat([
      zlib.gzipSync(Buffer.from('foo')),
      zlib.gzipSync(Buffer.from('bar'))
    ]);

    assert.strictEqual(Buffer.from(pako.ungzip(data)).toString(), 'foobar');
    assert.deepStrictEqual(pako.ungzip(data), new Uint8Array(zlib.gunzipSync(data)));
  });

  it('anything after the first zlib stream is ignored', () => {
    // tail here is a whole valid second stream - even that is dropped, so any
    // arbitrary trailing bytes are too
    const data = Buffer.concat([
      zlib.deflateSync(Buffer.from('AAA')),
      zlib.deflateSync(Buffer.from('BBB'))
    ]);

    assert.strictEqual(Buffer.from(pako.inflate(data)).toString(), 'AAA');
    assert.deepStrictEqual(pako.inflate(data), new Uint8Array(zlib.inflateSync(data)));
  });

  it('autodetect over zlib: does not loop into trailing data', () => {
    const data = Buffer.concat([
      zlib.deflateSync(Buffer.from('xyz')),
      zlib.deflateSync(Buffer.from('qqq'))
    ]);

    // default options => autodetect (windowBits 47); wrap has the gzip bit set
    // but flags===0 for a zlib member, so the member loop must NOT engage
    const inflator = new pako.Inflate();
    inflator.push(data, true);
    assert.strictEqual(inflator.err, 0);
    assert.strictEqual(Buffer.from(inflator.result).toString(), 'xyz');
  });
});


describe('Inflate gzip trailing zero padding via ArrayBuffer', () => {

  it('does not misread zero padding as a new member', () => {
    // trailing zero padding on an ArrayBuffer input must be ignored
    const gz = zlib.gzipSync(Buffer.from('padded'));
    const padded = Buffer.concat([ gz, Buffer.alloc(8) ]); // trailing zeros
    const ab = padded.buffer.slice(padded.byteOffset, padded.byteOffset + padded.byteLength);

    assert.deepStrictEqual(pako.ungzip(ab), new Uint8Array(zlib.gunzipSync(padded)));
    assert.strictEqual(Buffer.from(pako.ungzip(ab)).toString(), 'padded');
  });
});


// A stream cut off before its terminating marker is incomplete; finalizing it
// must fail rather than return the partial output.
describe('Inflate truncated input', () => {

  const full = zlib.deflateSync(Buffer.from('some longer payload to truncate'));
  const trunc = full.subarray(0, full.length - 5);

  it('one-shot inflate throws on incomplete data', () => {
    assert.throws(() => pako.inflate(trunc));
    assert.throws(() => zlib.inflateSync(trunc)); // node fails on it too
  });

  it('streaming push(..., true) reports an error', () => {
    const inflator = new pako.Inflate();
    const ok = inflator.push(trunc, true);

    assert.strictEqual(ok, false);
    assert.notStrictEqual(inflator.err, 0);
    assert.strictEqual(typeof inflator.result, 'undefined');
  });

  it('raw truncated input also throws', () => {
    const fullRaw = zlib.deflateRawSync(Buffer.from('payload that will be cut'));
    const truncRaw = fullRaw.subarray(0, fullRaw.length - 4);

    assert.throws(() => pako.inflateRaw(truncRaw));
    assert.throws(() => zlib.inflateRawSync(truncRaw)); // node fails on it too
  });

  it('complete input still succeeds', () => {
    assert.deepStrictEqual(pako.inflate(full), new Uint8Array(zlib.inflateSync(full)));
  });
});
