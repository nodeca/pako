'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Uint32Array !== 'undefined');

var _toString = Function.prototype.call.bind(Object.prototype.toString);
var isArray = Array.isArray || function (obj) { return _toString(obj) === '[object Array]'; };

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


exports.fill = function (buf, val) {
  var len = buf.length;

  if (!len) { return;}

  // fastest for untyped Array
  while (--len) { buf[len] = val; }
};
