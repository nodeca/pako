'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Uint32Array !== 'undefined');

var isArray = Array.isArray || function (obj) { return Object.prototype.toString.call(obj) === '[object Array]'; };

// For debug/testing. Set true to force use untyped arrays
exports.forceUntyped = false;

function typedOk() {
  return TYPED_OK && !exports.forceUntyped;
}

exports.typedOk = typedOk;


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof(source) !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


exports.arraySet = function (dest, src, src_offs, len, dest_offs) {

  // Suppose, that with typed array support destination is
  // always typed - don't check it
  if (typedOk() && (!isArray(src))) {

    // optimize full copy
    //if ((src_offs === 0) && (src.length === len)) {
    //  dest.set(src, dest_offs);
    //  return;
    //}

    dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
    return;
  }

  // Fallback to ordinary array
  for(var i=0; i<len; i++) {
    dest[dest_offs + i] = src[src_offs + i];
  }
};


exports.arrayCreate = function (length) {

  if (typedOk()) {
    return new Uint8Array(length);
  }

  // Fallback to ordinary array
  return new Array(length);
};


exports.array16Create = function (length) {

  if (typedOk()) {
    return new Uint16Array(length);
  }

  // Fallback to ordinary array
  return new Array(length);
};


// Join array of chunks to single array.
// Expect Array of (Array(Bytes) || Uint8Array).
//
exports.flattenChunks = function(chunks) {
  var i, l, len, pos, chunk, result;

  if (typedOk()) {
    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }

  // Fallback for untyped arrays
  return [].concat.apply([], chunks);
};
