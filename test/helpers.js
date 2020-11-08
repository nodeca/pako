'use strict';


const fs     = require('fs');
const path   = require('path');
const assert = require('assert');

const pako  = require('../index');

// Load fixtures to test
// return: { 'filename1': content1, 'filename2': content2, ...}
//
function loadSamples(subdir) {
  const result = {};
  const dir = path.join(__dirname, 'fixtures', subdir || 'samples');

  fs.readdirSync(dir).sort().forEach(function (sample) {
    const filepath = path.join(dir, sample);
    const extname  = path.extname(filepath);
    const basename = path.basename(filepath, extname);
    const content  = new Uint8Array(fs.readFileSync(filepath));

    if (basename[0] === '_') { return; } // skip files with name, started with dash

    result[basename] = content;
  });

  return result;
}


// Helper to test deflate/inflate with different options.
// Use zlib streams, because it's the only way to define options.
//
function testSingle(zlib_method, pako_method, data, options) {
  const zlib_options = Object.assign({}, options);

  // hack for testing negative windowBits
  if (zlib_options.windowBits < 0) { zlib_options.windowBits = -zlib_options.windowBits; }

  const zlib_result = zlib_method(data, zlib_options);
  const pako_result = pako_method(data, options);

  // One more hack: gzip header contains OS code, that can vary.
  // Override OS code if requested. For simplicity, we assume it on fixed
  // position (= no additional gzip headers used)
  if (options.ignore_os) zlib_result[9] = pako_result[9];

  assert.deepStrictEqual(pako_result, new Uint8Array(zlib_result));
}


function testSamples(zlib_method, pako_method, samples, options) {

  Object.keys(samples).forEach(function (name) {
    const data = samples[name];

    testSingle(zlib_method, pako_method, data, options);
  });
}


function testInflate(samples, inflateOptions, deflateOptions) {
  let name, data, deflated, inflated;

  // inflate options have windowBits = 0 to force autodetect window size
  //
  for (name in samples) {
    if (!samples.hasOwnProperty(name)) continue;
    data = samples[name];

    deflated = pako.deflate(data, deflateOptions);
    inflated = pako.inflate(deflated, inflateOptions);

    assert.deepStrictEqual(inflated, data);
  }
}


module.exports.testSamples = testSamples;
module.exports.testInflate = testInflate;
module.exports.loadSamples = loadSamples;
