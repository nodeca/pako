// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
var STR_APPLY_OK = true;
try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }


// Table with utf8 lengths
var utf8len = new utils.Buf8(256);
for (var i=0; i<256; i++) {
  utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}


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


// convert array to string
// src: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Base64_encoding_and_decoding
exports.buf2string = function (buf, max) {
  /*jshint nonstandard:true*/
  // That's not as fast as via String.fromCharCode.appy
  /*return decodeURIComponent(escape(exports.buf2binstring(
    (buf.length === max) ?
      buf
    :
      buf.subarray ? buf.subarray(0, max) : buf.slice(0, max)
  )));*/

  var str = '', i, out, part, char_len;
  var len = max || buf.length;
  var out_len = 0;
  var utf16buf;

  // Calculate output length
  for (i=0; i < len;) {
    i += utf8len[buf[i]];
    out_len++;
  }

  utf16buf = new utils.Buf32(out_len);

  for (out=0, i=0; i<len; i++) {
    part = buf[i];
    char_len = utf8len[part];

    // edge case - broken sequence
    if (i + char_len > len) {
      utf16buf[out++] = 0x7f;
      break;
    }
    switch (char_len) {
      case 1:
        utf16buf[out++] = part;
        break;
      case 2:
        utf16buf[out++] = ((part & 0x1f) << 6) | (buf[++i] & 0x7f);
        break;
      case 3:
        utf16buf[out++] = ((part & 0x0f) << 12) | ((buf[++i] & 0x3f) << 6) | (buf[++i] & 0x3f);
        break;
      case 4:
        utf16buf[out++] = ((part & 0x07) << 18) | ((buf[++i] & 0x3f) << 12) | ((buf[++i] & 0x3f) << 6) + (buf[++i] & 0x3f);
        break;
      // 5 & 6 bytes uticodes not supported in UTF16 (JS), so fill with dummy symbol
      case 5:
        i += 4;
        utf16buf[out++] = 0x7f;
        //utf16buf[out++] = (part - 248 << 24) + (buf[++i] - 128 << 18) + (buf[++i] - 128 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128;
        break;
      case 6:
        i += 5;
        utf16buf[out++] = 0x7f;
                          // (part - 252 << 32) is not possible in ECMAScript! So...:
        //utf16buf[out++] = (part - 252) * 1073741824 + (buf[++i] - 128 << 24) + (buf[++i] - 128 << 18) + (buf[++i] - 128 << 12) + (buf[++i] - 128 << 6) + buf[++i] - 128;
        break;
    }
  }

  if (STR_APPLY_OK) {
    return String.fromCharCode.apply(null, utf16buf);
  }

  // Fallback, when String.fromCharCode.apply not available
  for (i=0, len=utf16buf.length; i<len; i++) {
    str += String.fromCharCode(utf16buf[i]);
  }
  return str;
};


// calculate tail size of utf8 char by current byte value
exports.utf8tail = function(code) {
  return utf8len[code];
};
