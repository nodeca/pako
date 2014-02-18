'use strict';


var fs    = require('fs');
var path  = require('path');
var _     = require('lodash');
var async = require('async');

// Load fixtures to test
// return: { 'filename1': content1, 'filename2': content2, ...}
//
function loadSamples() {
  var result = {};
  var dir = path.join(__dirname, 'fixtures');

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

  for (var i=0, l=a.length; i<l; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}


// Helper to test deflate/deflateRaw with different options.
// Use zlib streams, because it's the only way to define options.
//
function testDeflateSingle(zlib_factory, pako_deflate, data, options, callback) {

  var zlibStream = zlib_factory(options);
  var buffers = [], nread = 0;


  zlibStream.on('error', function(err) {
    zlibStream.removeAllListeners();
    zlibStream=null;
    callback(err);
  });

  zlibStream.on('data', function(chunk) {
    buffers.push(chunk);
    nread += chunk.length;
  });

  zlibStream.on('end', function() {
    zlibStream.removeAllListeners();
    zlibStream=null;

    var buffer = Buffer.concat(buffers);

    var pako_result = pako_deflate(data, options);

    if (!cmpBuf(buffer, pako_result)) {
      callback(new Error('zlib result != pako result'));
      return;
    }

    callback(null);
  });


  zlibStream.write(new Buffer(data));
  zlibStream.end();
}

function testDeflate(zlib_factory, pako_deflate, samples, options, callback) {
  var queue = [];

  _.forEach(samples, function(data, name) {
    queue.push(function (done) {
      testDeflateSingle(zlib_factory, pako_deflate, data, options, function (err) {
        if (err) {
          done('Error in "' + name + '" - zlib result != pako result');
          return;
        }
        done();
      });
    });
  });

  async.series(queue, callback);
}

exports.cmpBuf = cmpBuf;
exports.testDeflate = testDeflate;
exports.testDeflateSingle = testDeflateSingle;
exports.loadSamples = loadSamples;