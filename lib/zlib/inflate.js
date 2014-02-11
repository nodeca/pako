'use strict';

//var utils = require('utils');

var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

//function Code() {
//  this.op = 0;           /* operation, extra bits, table bits */
//  this.bits = 0;         /* bits in this part of the code */
//  this.val = 0;          /* offset in table or code value */
//}

function InflateState() {
  this.mode = -1;             /* current inflate mode */
  this.last = 0;              /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = 0;          /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  this.head = 0;              /* where to save gzip header information */
  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = -1;           /* allocated sliding window, if needed */
  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */
  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */
  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */
  /* fixed and dynamic code tables */
  this.lencode = -1;          /* starting table for length/literal codes */
  this.distcode = -1;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */
  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = 0;             /* next available space in codes[] */

  //unsigned short array
  //todo: test later with Uint16Array
  this.lens = new Array(320); /* temporary storage for code lengths */
  this.work = new Array(280); /* work area for code table building */

  this.codes = new Array(ENOUGH);           /* space for code tables */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(/*strm*/) {

}

function inflateReset(/*strm*/) {

}

function inflateReset2(/*strm, windowBits*/) {

}

function inflateInit2(strm/*, windowBits, version, stream_size*/) {
  strm.state = new InflateState();
}

function inflateInit(/*strm, version, stream_size*/) {

}

function inflatePrime(/*strm, bits, value*/) {

}

/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
//function fixedtables(state) {
//
//}

/*
 Write out the inffixed.h that is #include'd above.  Defining MAKEFIXED also
 defines BUILDFIXED, so the tables are built on the fly.  makefixed() writes
 those tables to stdout, which would be piped to inffixed.h.  A small program
 can simply call makefixed to do this:

 void makefixed(void);

 int main(void)
 {
 makefixed();
 return 0;
 }

 Then that can be linked with zlib built with MAKEFIXED defined and run:

 a.out > inffixed.h
 */
//function makefixed() {
//
//}

/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
//function updatewindow(strm, end, copy) {
//
//}

function inflate(/*strm, flush*/) {

}

function inflateEnd(/*strm*/) {

}

function inflateGetDictionary(/*strm, dictionary, dictLength*/) {

}

function inflateSetDictionary(/*strm, dictionary, dictLength*/) {

}

function inflateGetHeader(/*strm, head*/) {

}

/*
 Search buf[0..len-1] for the pattern: 0, 0, 0xff, 0xff.  Return when found
 or when out of input.  When called, *have is the number of pattern bytes
 found in order so far, in 0..3.  On return *have is updated to the new
 state.  If on return *have equals four, then the pattern was found and the
 return value is how many bytes were read including the last byte of the
 pattern.  If *have is less than four, then the pattern has not been found
 yet and the return value is len.  In the latter case, syncsearch() can be
 called again with more data and the *have state.  *have is initialized to
 zero for the first call.
 */
//function syncsearch(/*have, buf, len*/) {
//
//}

function inflateSync(/*strm*/) {

}

function inflateSyncPoint(/*strm*/) {

}

function inflateCopy(/*dest, source*/) {

}

function inflateUndermine(/*strm, subvert*/) {

}

function inflateMark(/*strm*/) {

}

exports.inflateResetKeep = inflateResetKeep;

exports.inflateReset = inflateReset;

exports.inflateReset2 = inflateReset2;

exports.inflateInit2 = inflateInit2;

exports.inflateInit = inflateInit;

exports.inflatePrime = inflatePrime;

exports.inflate = inflate;

exports.inflateEnd = inflateEnd;

exports.inflateGetDictionary = inflateGetDictionary;

exports.inflateGetHeader = inflateGetHeader;

exports.inflateSetDictionary = inflateSetDictionary;

exports.inflateSync = inflateSync;

exports.inflateSyncPoint = inflateSyncPoint;

exports.inflateCopy = inflateCopy;

exports.inflateUndermine = inflateUndermine;

exports.inflateMark = inflateMark;