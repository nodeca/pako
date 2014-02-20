'use strict';

var c = require('constants');

// TODO: remove Z_NULL. Set proper values directly
function ZStream() {
  /* next input byte */
  this.next_in = c.Z_NULL;
  /* number of bytes available at next_in */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  //this.next_out = c.Z_NULL;
  /* remaining free space at next_out */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  //this.msg = c.Z_NULL;
  /* not visible by applications */
  this.state = c.Z_NULL;
  /* best guess about the data type: binary or text */
  this.data_type = 2;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;