function _has(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function assign(obj /*from1, from2, from3, ...*/) {
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
}


// reduce buffer size, avoiding mem copy
export function shrinkBuf(buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
}

export function arraySet(dest, src, src_offs, len, dest_offs) {
  // Fallback to ordinary array
  if (!src.subarray || !dest.subarray) {
    for (var i = 0; i < len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
    return;
  }

  dest.set(src.subarray(src_offs, src_offs + len), dest_offs);
}

  // Join array of chunks to single array.
export function flattenChunks(chunks) {
  // Fallback to ordinary array
  if (!Uint8Array) {
    return [].concat.apply([], chunks);
  }

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
}
