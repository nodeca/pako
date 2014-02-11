'use strict';

exports.assign = function(obj /*from1, from2, from3, ...*/) {
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


exports.arraySet = function(dest, src, src_offs, len, dest_offs) {
  for(var i=0; i<len; i++) {
    dest[dest_offs + i] = src[src_offs + i];
  }
};


exports.arrayCreate = function(length) {
  return new Array(length);
};
