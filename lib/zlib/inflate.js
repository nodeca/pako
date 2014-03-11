'use strict';


var utils = require('./utils');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function Code() {
  this.op = 0;           /* operation, extra bits, table bits */
  this.bits = 0;         /* bits in this part of the code */
  this.val = 0;          /* offset in table or code value */
}

Code.prototype.clone = function() {
  var new_code = new Code();
  new_code.op = this.op;
  new_code.bits = this.bits;
  new_code.val = this.val;
  return new_code;
};

function CodeTable(length) {
  this.op = length ? utils.arrayCreate(length) : null;
  this.val = length ? utils.array16Create(length): null;
  this.bits = length ? utils.arrayCreate(length) : null;
}

CodeTable.prototype.fill = function(idx, code) {
  code.bits = this.bits[idx];
  code.op = this.op[idx];
  code.val = this.val[idx];
};

CodeTable.prototype.set = function(idx, code) {
  this.bits[idx] = code.bits;
  this.op[idx] = code.op;
  this.val[idx] = code.val;
};

CodeTable.prototype.copy = function(table) {
  utils.arraySet(this.bits,table.bits,0,table.bits.length,0);
  utils.arraySet(this.op,table.op,0,table.op.length,0);
  utils.arraySet(this.val,table.val,0,table.val.length,0);
};

function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */
  this.next_index = 0;

  //unsigned short array
  //todo: test later with Uint16Array
  this.lens = utils.array16Create(320); /* temporary storage for code lengths */
  this.work = utils.array16Create(280); /* work area for code table building */

  // TODO: 8 or 16 bits?
  this.codes = new CodeTable(ENOUGH);       /* space for code tables */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */

  this.here = new Code();
}

function InfTableOptions(type, lens, lens_index, codes, table, table_index, bits, work) {
  this.type = type;
  this.lens = lens;
  this.lens_index = lens_index;
  this.codes = codes;
  this.table = table;
  this.table_index = table_index;
  this.bits = bits;
  this.work = work;
  this.here = new Code();
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  //strm.msg = Z_NULL;
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  // TODO: may be {}
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  //utils.arraySet(state.lencode,state.codes,0,state.codes.length,0);
  //utils.arraySet(state.distcode,state.codes,0,state.codes.length,0);
  state.lencode = new CodeTable(ENOUGH);
  state.distcode = new CodeTable(ENOUGH);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}

function inflatePrime(strm, bits, value) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if (bits < 0) {
    state.hold = 0;
    state.bits = 0;
    return Z_OK;
  }
  if (bits > 16 || state.bits + bits > 32) { return Z_STREAM_ERROR; }
  value &= (1 << bits) - 1;
  state.hold += value << state.bits;
  state.bits += bits;
  return Z_OK;
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
//var virgin = true;
//var lenfix, distfix;
//var fixed = new CodeTable(544);


function fixedtables(state) {
//#ifdef BUILDFIXED

//  /* build fixed huffman tables if first call (may not be thread safe) */
//  if (virgin) {
//    var sym, bits;
//    var next;
//
//    /* literal/length table */
//    sym = 0;
//    while (sym < 144) state.lens[sym++] = 8;
//    while (sym < 256) state.lens[sym++] = 9;
//    while (sym < 280) state.lens[sym++] = 7;
//    while (sym < 288) state.lens[sym++] = 8;
//    next = fixed;
//    lenfix = next;
//    bits = 9;
//    inflate_table(new InfTableOptions(LENS, state.lens, 288, next,0, bits, state.work));
//
//    /* distance table */
//    sym = 0;
//    while (sym < 32) state.lens[sym++] = 5;
//    distfix = next;
//    bits = 5;
//
//    inflate_table(new InfTableOptions(DISTS, state.lens, 32, next,0, bits, state.work));
//
//    /* do this just once */
//    virgin = false;
//  }
//#else /* !BUILDFIXED */
//#   include "inffixed.h"
//#endif /* BUILDFIXED */
  var lenfix = new CodeTable(544);
  utils.arraySet(lenfix.op,[96,0,0,20,18,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,64,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,96,0,0,21,18,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,16,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,64,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,96,0,0,20,18,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,64,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,96,0,0,21,18,0,0,0,16,0,0,0,0,0,0,0,16,0,0,0,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,16,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,21,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0,16,0,0,64,19,0,0,0,17,0,0,0,0,0,0,0,16,0,0,0,20,0,0,0,18,0,0,0,0,0,0,0], 0, 544, 0);
  utils.arraySet(lenfix.bits,[7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,8,7,8,8,9,7,8,8,9,8,8,8,9,7,8,8,9,7,8,8,9,7,8,8,9,8,8,8,9], 0, 544, 0);
  utils.arraySet(lenfix.val,[0,80,16,115,31,112,48,192,10,96,32,160,0,128,64,224,6,88,24,144,59,120,56,208,17,104,40,176,8,136,72,240,4,84,20,227,43,116,52,200,13,100,36,168,4,132,68,232,8,92,28,152,83,124,60,216,23,108,44,184,12,140,76,248,3,82,18,163,35,114,50,196,11,98,34,164,2,130,66,228,7,90,26,148,67,122,58,212,19,106,42,180,10,138,74,244,5,86,22,0,51,118,54,204,15,102,38,172,6,134,70,236,9,94,30,156,99,126,62,220,27,110,46,188,14,142,78,252,0,81,17,131,31,113,49,194,10,97,33,162,1,129,65,226,6,89,25,146,59,121,57,210,17,105,41,178,9,137,73,242,4,85,21,258,43,117,53,202,13,101,37,170,5,133,69,234,8,93,29,154,83,125,61,218,23,109,45,186,13,141,77,250,3,83,19,195,35,115,51,198,11,99,35,166,3,131,67,230,7,91,27,150,67,123,59,214,19,107,43,182,11,139,75,246,5,87,23,0,51,119,55,206,15,103,39,174,7,135,71,238,9,95,31,158,99,127,63,222,27,111,47,190,15,143,79,254,0,80,16,115,31,112,48,193,10,96,32,161,0,128,64,225,6,88,24,145,59,120,56,209,17,104,40,177,8,136,72,241,4,84,20,227,43,116,52,201,13,100,36,169,4,132,68,233,8,92,28,153,83,124,60,217,23,108,44,185,12,140,76,249,3,82,18,163,35,114,50,197,11,98,34,165,2,130,66,229,7,90,26,149,67,122,58,213,19,106,42,181,10,138,74,245,5,86,22,0,51,118,54,205,15,102,38,173,6,134,70,237,9,94,30,157,99,126,62,221,27,110,46,189,14,142,78,253,0,81,17,131,31,113,49,195,10,97,33,163,1,129,65,227,6,89,25,147,59,121,57,211,17,105,41,179,9,137,73,243,4,85,21,258,43,117,53,203,13,101,37,171,5,133,69,235,8,93,29,155,83,125,61,219,23,109,45,187,13,141,77,251,3,83,19,195,35,115,51,199,11,99,35,167,3,131,67,231,7,91,27,151,67,123,59,215,19,107,43,183,11,139,75,247,5,87,23,0,51,119,55,207,15,103,39,175,7,135,71,239,9,95,31,159,99,127,63,223,27,111,47,191,15,143,79,255], 0, 544, 0);

  var distfix = new CodeTable(32);
  utils.arraySet(distfix.op, [16,23,19,27,17,25,21,29,16,24,20,28,18,26,22,64,16,23,19,27,17,25,21,29,16,24,20,28,18,26,22,64], 0, 32, 0);
  utils.arraySet(distfix.bits, [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], 0, 32, 0);
  utils.arraySet(distfix.val, [1,257,17,4097,5,1025,65,16385,3,513,33,8193,9,2049,129,0,2,385,25,6145,7,1537,97,24577,4,769,49,12289,13,3073,193,0], 0, 32, 0);

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}

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
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = utils.arrayCreate(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = new Code();                   /* current decoding table entry */
  var last;                   /* parent table entry */
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = utils.arrayCreate(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  // TODO: check if needed and don't affect speed
  //if (strm === Z_NULL || strm.state === Z_NULL || strm.next_out === Z_NULL ||
  //    (strm.next_in === Z_NULL && strm.avail_in !== 0))
  //    return Z_STREAM_ERROR;

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out_index;
  output = strm.next_out;
  left = strm.avail_out;
  next = strm.next_in_index;
  input = strm.next_in;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = -1;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head &&
              state.head.extra) {
            len = state.head.extra_len - state.length;
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
            throw 'Review & implement right';
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          if (state.head && state.head.name &&
              (state.length < state.head.name_max)) {
            state.head.name[state.length++] = len;
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          if (state.head && state.head.comment &&
              (state.length < state.head.comm_max)) {
            state.head.comment[state.length++] = len;
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = 1;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out_index = put;
        strm.avail_out = left;
        strm.next_in_index = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      //state.next = state.codes;
      // TODO:
      //state.lencode = state.next;
      state.lencode.copy(state.codes);
      state.lenbits = 7;

      opts = new InfTableOptions(CODES, state.lens, 0, 19, state.lencode, 0, state.lenbits, state.work);
      ret = inflate_table(opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          state.lencode.fill(hold & ((1 << state.lenbits) - 1), here);/*BITS(state.lenbits)*/
          if ((here.bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here.val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here.bits;
          bits -= here.bits;
          //---//
          state.lens[state.have++] = here.val;
        }
        else {
          if (here.val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here.bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here.bits;
            bits -= here.bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here.val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here.bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here.bits;
            bits -= here.bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here.bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here.bits;
            bits -= here.bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lencode.copy(state.codes);
      state.lenbits = 9;

      opts = new InfTableOptions(LENS, state.lens, 0, state.nlen,state.lencode,0, state.lenbits, state.work);
      ret = inflate_table(opts);
//      state.next_index = opts.table_index;
      state.lenbits = opts.bits;
//      state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      state.distcode.copy(state.codes);
      opts = new InfTableOptions(DISTS, state.lens, state.nlen, state.ndist, state.distcode,0, state.distbits, state.work);
      ret = inflate_table(opts);
//      state.next_index = opts.table_index;
      state.distbits = opts.bits;
//      state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out_index = put;
        strm.avail_out = left;
        strm.next_in_index = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out_index;
        output = strm.next_out;
        left = strm.avail_out;
        next = strm.next_in_index;
        input = strm.next_in;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        state.lencode.fill(hold & ((1 << state.lenbits) -1),here);  /*BITS(state.lenbits)*/
        if (here.bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here.op && (here.op & 0xf0) === 0) {
        last = here.clone();
        for (;;) {
          state.lencode.fill(last.val +
                  ((hold & ((1 << (last.bits + last.op)) -1))/*BITS(last.bits + last.op)*/ >> last.bits), here);
          if ((last.bits + here.bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last.bits;
        bits -= last.bits;
        //---//
        state.back += last.bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here.bits;
      bits -= here.bits;
      //---//
      state.back += here.bits;
      state.length = here.val;
      if (here.op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here.op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here.op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here.op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        state.distcode.fill(hold & ((1 << state.distbits) -1), here);/*BITS(state.distbits)*/
        if ((here.bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here.op & 0xf0) === 0) {
        last = here.clone();
        for (;;) {
          state.distcode.fill(last.val +
                  ((hold & ((1 << (last.bits + last.op)) -1))/*BITS(last.bits + last.op)*/ >> last.bits), here);
          if ((last.bits + here.bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last.bits;
        bits -= last.bits;
        //---//
        state.back += last.bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here.bits;
      bits -= here.bits;
      //---//
      state.back += here.bits;
      if (here.op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here.val;
      state.extra = (here.op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
          //Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          hold >>>= 0;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out_index = put;
  strm.avail_out = left;
  strm.next_in_index = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.next_out, strm.next_out_index, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out_index - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out_index - _out) : adler32(state.check, output, _out, strm.next_out_index - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {
//  if (strm == Z_NULL || strm->state == Z_NULL || strm->zfree == (free_func)0)
//  return Z_STREAM_ERROR;
  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
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