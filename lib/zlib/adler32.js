'use strict';

var BASE = 65521;      /* largest prime smaller than 65536 */
var NMAX =  5552;

function adler32(adler, buf, len)
{
  var i = 0;
  /* split Adler-32 into component sums */
  var sum2 = (adler >> 16) & 0xffff;
  adler &= 0xffff;

  /* in case user likes doing a byte at a time, keep it fast */
  if (len == 1) {
    adler += buf[0];
    if (adler >= BASE)
      adler -= BASE;
    sum2 += adler;
    if (sum2 >= BASE)
      sum2 -= BASE;
    return (adler | (sum2 << 16)) >>> 0;
  }

  /* in case short lengths are provided, keep it somewhat fast */
  if (len < 16) {
    for(i=0;i<len;i++) {
      adler += buf[i];
      sum2 += adler;
    }
    if (adler >= BASE)
      adler -= BASE;
    sum2 %= BASE;            /* only added so many BASE's */
    return (adler | (sum2 << 16)) >>> 0;
  }

  var cursor = 0;
  /* do length NMAX blocks -- requires just one modulo operation */
  while (len >= NMAX) {
    len -= NMAX;
    var next_cursor = cursor + NMAX;
    for (i=cursor;i<next_cursor;i++) {
      adler += buf[i];
      sum2 += adler;
    }

    adler %= BASE;
    sum2 %= BASE;
  }

  /* do remaining bytes (less than NMAX, still just one modulo) */
  if (len) {                  /* avoid modulos if none remaining */
    for (i=cursor;i<len;i++) {
      adler += buf[i];
      sum2 += adler;
    }

    adler %= BASE;
    sum2 %= BASE;
  }

  /* return recombined sums */
  return (adler | (sum2 << 16)) >>> 0;
}

module.exports = adler32;