var consts = require('constants');

function internal_state() {
  this.status = 0;            /* as the name implies */
  this.pending_buf = -1;    /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = -1;    /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.last_flush = -1;     /* value of flush param for previous deflate call */

  this.w_size = 0;        /* LZ77 window size (32K by default) */
  this.w_bits = 0;        /* log2(w_size)  (8..16) */
  this.w_mask = 0;        /* w_size - 1 */

  this.window = -1;
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

  this.prev = -1;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = -1; /* Heads of the hash chains or NIL. */

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

}

function deflateInit2 (strm, level, method, windowBits, memLevel, strategy) {

}

function deflateSetDictionary (strm, dictionary, dictLength) {

}

function deflateResetKeep (strm) {

}

function deflateReset (strm) {

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