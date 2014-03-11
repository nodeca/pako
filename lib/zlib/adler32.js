'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = adler & 0xffff
    , s2 = (adler >>> 16) & 0xffff
    , n = 0;

  while (len !== 0) {
    n = len > 5552 ? 5552 : len;
    len -= n;

    do {
      s1 += buf[pos++];
      s2 += s1;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16));
}


module.exports = adler32;