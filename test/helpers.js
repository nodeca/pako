'use strict';


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
function testDeflate(zlib_factory, pako_deflate, data, options, callback) {

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


exports.cmpBuf = cmpBuf;
exports.testDeflate = testDeflate;