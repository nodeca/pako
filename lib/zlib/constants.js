module.exports = {
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:         (-1),
  Z_STREAM_ERROR:  (-2),
  Z_DATA_ERROR:    (-3),
  Z_MEM_ERROR:     (-4),
  Z_BUF_ERROR:     (-5),
  Z_VERSION_ERROR: (-6),
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,
  /* compression levels */
  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  Z_BINARY:                 0,
  Z_TEXT:                   1,
  Z_ASCII:                  1, // = Z_TEXT
  Z_UNKNOWN:                2,
  /* Possible values of the data_type field (though see inflate()) */

  Z_DEFLATED:               8,
  /* The deflate compression method */
  Z_NULL:                   0
}