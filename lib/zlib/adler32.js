'use strict';

function adler32(adler, buf, len, start)
{
  var BASE = 65521;      /* largest prime smaller than 65536 */
  var NMAX =  5552;

  var i = start;
  /* split Adler-32 into component sums */
  var sum2 = (adler >> 16) & 0xffff;
  adler &= 0xffff;

  /* in case user likes doing a byte at a time, keep it fast */
  if (len === 1) {
    adler += buf[0];
    if (adler >= BASE) {
      adler -= BASE;
    }
    sum2 += adler;
    if (sum2 >= BASE) {
      sum2 -= BASE;
    }
    return (adler | (sum2 << 16)) >>> 0;
  }

  /* in case short lengths are provided, keep it somewhat fast */
  if (len < 16) {
    for(i=0;i<len;i++) {
      adler += buf[i];
      sum2 += adler;
    }
    if (adler >= BASE) {
      adler -= BASE;
    }
    sum2 %= BASE;            /* only added so many BASE's */
    return (adler | (sum2 << 16)) >>> 0;
  }

  while (len>0) {
    var cursor = len > NMAX ? NMAX : len;
    len -= cursor;
    for(var j=0;j<cursor;j++) {
      adler += buf[i++];
      sum2 += adler;
    }

    adler %= BASE;
    sum2 %= BASE;
  }

  /* return recombined sums */
  return (adler | (sum2 << 16)) >>> 0;
}

module.exports = adler32;