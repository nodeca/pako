'use strict';

var utils = require('./utils');

var STORED_BLOCK = 0;
var Buf_size = 16;

/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}

/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits (s, value, length)
{
  var len = length, val = value;
  if (s.bi_valid > Buf_size - len) {
    s.bi_buf |= (val << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = val >>> (Buf_size - s.bi_valid);
    s.bi_valid += len - Buf_size;
  } else {
    s.bi_buf |=  ((value) << s.bi_valid) & 0xffff;
    s.bi_valid += len;
  }
}

/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup (s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block (s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}


/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{
//  todo: tr_static_init();
//
//  s.l_desc.dyn_tree = s.dyn_ltree;
//  s.l_desc.stat_desc = static_l_desc;
//
//  s.d_desc.dyn_tree = s.dyn_dtree;
//  s.d_desc.stat_desc = static_d_desc;
//
//  s.bl_desc.dyn_tree = s.bl_tree;
//  s.bl_desc.stat_desc = static_bl_desc;
//
  s.bi_buf = 0;
  s.bi_valid = 0;
//
//  /* Initialize the first block of the first file: */
// todo:init_block(s);
}

/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, 1); /* with header */
}

/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb = 0, static_lenb = 0; /* opt_len and static_len in bytes */
//  var max_blindex = 0;  /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {
    /* Construct the literal and distance trees */
    //todo: build_tree(s, s.l_desc);
    //todo: build_tree(s, s->d_desc);

    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    //todo: max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len + 3 + 7) >>> 3;
    static_lenb = (s.static_len + 3 + 7) >>> 3;

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);
  }
//  else {
//    //send_bits(s, (DYN_TREES<<1)+(last ? 1 : 0), 3);
//    //todo: send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1,max_blindex+1);
//    //todo: compress_block(s, s->dyn_ltree,s->dyn_dtree);
//  }

  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  //todo: init_block(s);

  if (last) {
    bi_windup(s);
  }
}

exports._tr_init = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block = _tr_flush_block;