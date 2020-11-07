'use strict';


function _has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

module.exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (_has(source, p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// Join array of chunks to single array.
module.exports.flattenChunks = function (chunks) {
  var i, l, len, pos, chunk, result;

  // calculate data length
  len = 0;
  for (i = 0, l = chunks.length; i < l; i++) {
    len += chunks[i].length;
  }

  // join chunks
  result = new Uint8Array(len);
  pos = 0;
  for (i = 0, l = chunks.length; i < l; i++) {
    chunk = chunks[i];
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
};
