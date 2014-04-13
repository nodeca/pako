// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
var STR_APPLY_OK = true;
try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }


// convert string to array (typed, when possible)
// src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
exports.string2buf = function (str) {
  var buf, c, str_len = str.length, buf_len = 0;

  /* mapping... */

  for (var m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : c < 0x200000 ? 4 : c < 0x4000000 ? 5 : 6;
  }

  buf = new utils.Buf8(buf_len);

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
  var buf = new utils.Buf8(str.length);
  for(var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// calculate tail size of utf8 char by current byte value
exports.utf8tail = function(code) {
  return code >= 252 ? 6 : code >= 248 ? 5 : code >= 240 ? 4 : code >= 224 ? 3 : code >= 192 ? 2 : 1;
};
