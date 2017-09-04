'use strict';


var fs     = require('fs');
var path   = require('path');
var assert = require('assert');

var pako_utils = require('../lib/utils/common');
var pako  = require('../index');

// Load fixtures to test
// return: { 'filename1': content1, 'filename2': content2, ...}
//
function loadSamples(subdir) {
  var result = {};
  var dir = path.join(__dirname, 'fixtures', subdir || 'samples');

  fs.readdirSync(dir).sort().forEach(function (sample) {
    var filepath = path.join(dir, sample),
        extname  = path.extname(filepath),
        basename = path.basename(filepath, extname),
        content  = new Uint8Array(fs.readFileSync(filepath));

    if (basename[0] === '_') { return; } // skip files with name, started with dash

    result[basename] = content;
  });

  return result;
}


// Compare 2 buffers (can be Array, Uint8Array, Buffer).
//
function cmpBuf(a, b) {
  if (a.length !== b.length) {
    return false;
  }

  for (var i = 0, l = a.length; i < l; i++) {
    if (a[i] !== b[i]) {
      //console.log('pos: ' +i+ ' - ' + a[i].toString(16) + '/' + b[i].toString(16));
      return false;
    }
  }

  return true;
}


function toBuffer(src) { return Buffer.from ? Buffer.from(src) : new Buffer(src); }


// Helper to test deflate/inflate with different options.
// Use zlib streams, because it's the only way to define options.
//
function testSingle(zlib_method, pako_method, data, options) {
  var zlib_options = Object.assign({}, options);

  // hack for testing negative windowBits
  if (zlib_options.windowBits < 0) { zlib_options.windowBits = -zlib_options.windowBits; }

  var zlib_result = zlib_method(toBuffer(data), zlib_options);
  var pako_result = pako_method(data, options);

  // One more hack: gzip header contains OS code, that can vary.
  // Override OS code if requested. For simplicity, we assume it on fixed
  // position (= no additional gzip headers used)
  if (options.ignore_os) zlib_result[9] = pako_result[9];

  assert.deepEqual(pako_result, zlib_result);
}


function testSamples(zlib_method, pako_method, samples, options) {

  Object.keys(samples).forEach(function (name) {
    var data = samples[name];

    // with untyped arrays
    pako_utils.setTyped(false);
    testSingle(zlib_method, pako_method, data, options);

    // with typed arrays
    pako_utils.setTyped(true);
    testSingle(zlib_method, pako_method, data, options);
  });
}


function testInflate(samples, inflateOptions, deflateOptions) {
  var name, data, deflated, inflated;

  // inflate options have windowBits = 0 to force autodetect window size
  //
  for (name in samples) {
    if (!samples.hasOwnProperty(name)) continue;
    data = samples[name];

    // always use the same data type to generate sample
    pako_utils.setTyped(true);
    deflated = pako.deflate(data, deflateOptions);

    // with untyped arrays
    pako_utils.setTyped(false);
    inflated = pako.inflate(deflated, inflateOptions);
    pako_utils.setTyped(true);

    assert.deepEqual(inflated, data);

    // with typed arrays
    inflated = pako.inflate(deflated, inflateOptions);

    assert.deepEqual(inflated, data);
  }
}


exports.cmpBuf = cmpBuf;
exports.testSamples = testSamples;
exports.testInflate = testInflate;
exports.loadSamples = loadSamples;
