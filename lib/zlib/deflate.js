var c = require('./constants');
var adler32 = require('./adler32');

var FASTEST = true;

var Z_NULL = c.Z_NULL;

var MAX_WBITS = 15; /* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var INIT_STATE =      42;
var EXTRA_STATE =     69;
var NAME_STATE =      73;
var COMMENT_STATE =   91;
var HCRC_STATE =     103;
var BUSY_STATE =     113;
var FINISH_STATE =   666;

var config = function(good_length,max_lazy,nice_length,max_chain,func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
}

var configuration_table;

if (FASTEST) {
  configuration_table = [
/*      good lazy nice chain */
/* 0 */ new config(0,    0,  0,    0, deflate_stored),  /* store only */
/* 1 */ new config(4,    4,  8,    4, deflate_fast)     /* max speed, no lazy matches */
  ]
} else {
  configuration_table = [
  /*      good lazy nice chain */
  /* 0 */ new config(0,    0,  0,    0, deflate_stored),  /* store only */
  /* 1 */ new config(4,    4,  8,    4, deflate_fast),    /* max speed, no lazy matches */
  /* 2 */ new config(4,    5, 16,    8, deflate_fast),
  /* 3 */ new config(4,    6, 32,   32, deflate_fast),

  /* 4 */ new config(4,    4, 16,   16, deflate_slow),    /* lazy matches */
  /* 5 */ new config(8,   16, 32,   32, deflate_slow),
  /* 6 */ new config(8,   16, 128, 128, deflate_slow),
  /* 7 */ new config(8,   32, 128, 256, deflate_slow),
  /* 8 */ new config(32, 128, 258, 1024, deflate_slow),
  /* 9 */ new config(32, 258, 258, 4096, deflate_slow)    /* max compression */
  ]
}

function deflate_state() {
  this.status = 0;            /* as the name implies */
  this.pending_buf = Z_NULL;    /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = Z_NULL;    /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.last_flush = Z_NULL;     /* value of flush param for previous deflate call */

  this.w_size = 0;        /* LZ77 window size (32K by default) */
  this.w_bits = 0;        /* log2(w_size)  (8..16) */
  this.w_mask = 0;        /* w_size - 1 */

  this.window = Z_NULL;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = Z_NULL;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = Z_NULL; /* Heads of the hash chains or NIL. */

  this.ins_h      = 0;      /* hash index of string to be inserted */
  this.hash_size  = 0;      /* number of elements in hash table */
  this.hash_bits  = 0;      /* log2(hash_size) */
  this.hash_mask  = 0;      /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length       = 0;         /* length of best match */
  this.prev_match         = 0;         /* previous match */
  this.match_available    = 1;         /* set if previous match exists */
  this.strstart           = 0;         /* start of string to insert */
  this.match_start        = 0;         /* start of matching string */
  this.lookahead          = 0;         /* number of valid bytes ahead in window */

  this.prev_length        = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;    /* compression level (1..9) */
  this.strategy = 0; /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */
}

function deflateInit (strm, level) {
  return deflateInit2(strm, level, c.Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL,c.Z_DEFAULT_STRATEGY);
}

function deflateInit2 (strm, level, method, windowBits, memLevel, strategy) {
  if (strm == Z_NULL) return c.Z_STREAM_ERROR;

  if(FASTEST) {
    if (level != 0) level = 1;
  } else {
    if (level == c.Z_DEFAULT_COMPRESSION) level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  if (windowBits == 8) windowBits = 9;  /* until 256-byte window bug fixed */

  var s = new deflate_state();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = Z_NULL;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift =  ((s.hash_bits+MIN_MATCH-1)/MIN_MATCH);

  s.high_water = 0;      /* nothing written to s->window yet */
  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateSetDictionary (strm, dictionary, dictLength) {

}

function deflateResetKeep (strm) {
  strm.total_in = strm.total_out = 0;
  strm.data_type = c.Z_UNKNOWN;

  var s = strm.state;
  s.pending = 0;
  s.pending_out = s.pending_buf;

  if (s.wrap < 0) {
    s.wrap = -s.wrap; /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = s.wrap ? INIT_STATE : BUSY_STATE;
  strm.adler = adler32(0, Z_NULL, 0);
  s.last_flush = c.Z_NO_FLUSH;
  //_tr_init(s);
  return c.Z_OK;
}

function deflateReset (strm) {
  var ret = deflateResetKeep(strm);
  if (ret == c.Z_OK)
    lm_init(strm.state);
  return ret;
}

function deflateParams (strm,level,strategy) {

}

function deflateSetHeader (strm, head) {

}

function deflateBound(strm, sourceLen) {

}

function deflatePending (strm, pending, bits) {

}

/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB (s, b) {

}

/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->next_out buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {

}

function deflate (strm, flush) {

}

function deflateEnd (strm) {

}

/* =========================================================================
 * Copy the source state to the destination state
 */
function deflateCopy (dest, source) {

}

/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->next_in buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, size) {

}

/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init (s) {
  s.window_size = 2* s.w_size;

  /* Set the default configuration parameters:
   */
  s.max_lazy_match   = configuration_table[s.level].max_lazy;
  s.good_match       = configuration_table[s.level].good_length;
  s.nice_match       = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH-1;
  s.match_available = 0;
  s.ins_h = 0;
}

/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {

}

/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {

}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {

}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {

}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {

}

/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {

}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {

}

exports.deflateInit = deflateInit;

exports.deflateInit2 = deflateInit2;

exports.deflateSetDictionary = deflateSetDictionary;

exports.deflateReset = deflateReset;

exports.deflateParams = deflateParams;

exports.deflateSetHeader = deflateSetHeader;

exports.deflateBound = deflateBound;

exports.deflatePending = deflatePending;

exports.deflate = deflate;

exports.deflateEnd = deflateEnd;