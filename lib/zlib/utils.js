'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');

// Quick check if we can use fast array to bin string conversion
var STR_APPLY_OK = true;
try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }


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


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


// convert string to array (typed, when possible)
// src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
exports.string2buf = function (str) {
  var buf, c, str_len = str.length, buf_len = 0;

  /* mapping... */

  for (var m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : c < 0x200000 ? 4 : c < 0x4000000 ? 5 : 6;
  }

  buf = new exports.Buf8(buf_len);

  /* transcription... */

  for (var i = 0, c_pos = 0; i < buf_len; c_pos++) {
    c = str.charCodeAt(c_pos);
    if (c < 128) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 192 + (c >>> 6);
      buf[i++] = 128 + (c & 63);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 224 + (c >>> 12);
      buf[i++] = 128 + (c >>> 6 & 63);
      buf[i++] = 128 + (c & 63);
    } else if (c < 0x200000) {
      /* four bytes */
      buf[i++] = 240 + (c >>> 18);
      buf[i++] = 128 + (c >>> 12 & 63);
      buf[i++] = 128 + (c >>> 6 & 63);
      buf[i++] = 128 + (c & 63);
    } else if (c < 0x4000000) {
      /* five bytes */
      buf[i++] = 248 + (c >>> 24);
      buf[i++] = 128 + (c >>> 18 & 63);
      buf[i++] = 128 + (c >>> 12 & 63);
      buf[i++] = 128 + (c >>> 6 & 63);
      buf[i++] = 128 + (c & 63);
    } else /* if (c <= 0x7fffffff) */ {
      /* six bytes */
      buf[i++] = 252 + /* (c >>> 32) is not possible in ECMAScript! So...: */ (c / 1073741824);
      buf[i++] = 128 + (c >>> 24 & 63);
      buf[i++] = 128 + (c >>> 18 & 63);
      buf[i++] = 128 + (c >>> 12 & 63);
      buf[i++] = 128 + (c >>> 6 & 63);
      buf[i++] = 128 + (c & 63);
    }
  }

  return buf;
};


// convert array to string
// src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
exports.buf2string = function (buf, max) {
  var str = '';

  for (var part, len = max || buf.length, i = 0; i < len; i++) {
    part = buf[i];
    str += String.fromCharCode(
      part > 251 && part < 254 && i + 5 < len ? /* six bytes */
        /* (part - 252 << 32) is not possible in ECMAScript! So...: */
        (part - 252) * 1073741824 + (buf[++i] - 128 << 24) + (buf[++i] - 128 << 18) + (buf[++i] - 128 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128
      : part > 247 && part < 252 && i + 4 < len ? /* five bytes */
        (part - 248 << 24) + (buf[++i] - 128 << 18) + (buf[++i] - 128 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128
      : part > 239 && part < 248 && i + 3 < len ? /* four bytes */
        (part - 240 << 18) + (buf[++i] - 128 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128
      : part > 223 && part < 240 && i + 2 < len ? /* three bytes */
        (part - 224 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128
      : part > 191 && part < 224 && i + 1 < len ? /* two bytes */
        (part - 192 << 6) + buf[++i] - 128
      : /* part < 127 ? */ /* one byte */
        part
    );
  }

  return str;
};


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  // use fallback for big arrays to avoid stack overflow
  if (STR_APPLY_OK && buf.length < 65537) {
    return String.fromCharCode.apply(null, buf);
  }

  var result = '';
  for(var i=0, len=buf.length; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new exports.Buf8(str.length);
  for(var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    // Suppose, that with typed array support destination is
    // always typed - don't check it
    if (src.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

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
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);