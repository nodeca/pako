// (C) 1995-2013 Jean-loup Gailly and Mark Adler
// (C) 2014-2017 Vitaly Puzrin and Andrey Tupitsin
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//   claim that you wrote the original software. If you use this software
//   in a product, an acknowledgment in the product documentation would be
//   appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//   misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.


  /* Allowed flush values; see deflate() and inflate() below for details */
export const Z_NO_FLUSH =         0;
export const Z_PARTIAL_FLUSH =    1;
export const Z_SYNC_FLUSH =       2;
export const Z_FULL_FLUSH =       3;
export const Z_FINISH =           4;
export const Z_BLOCK =            5;
export const Z_TREES =            6;

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
export const Z_OK =               0;
export const Z_STREAM_END =       1;
export const Z_NEED_DICT =        2;
export const Z_ERRNO =           -1;
export const Z_STREAM_ERROR =    -2;
export const Z_DATA_ERROR =      -3;
export const Z_MEM_ERROR =       -4;
export const Z_BUF_ERROR =       -5;
  //Z_VERSION_ERROR: -6,

  /* compression levels */
export const Z_NO_COMPRESSION =         0;
export const Z_BEST_SPEED =             1;
export const Z_BEST_COMPRESSION =       9;
export const Z_DEFAULT_COMPRESSION =   -1;
export const Z_FILTERED =               1;
export const Z_HUFFMAN_ONLY =           2;
export const Z_RLE =                    3;
export const Z_FIXED =                  4;
export const Z_DEFAULT_STRATEGY =       0;

  /* Possible values of the data_type field (though see inflate()) */
export const Z_BINARY =                 0;
export const Z_TEXT =                   1;
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
export const Z_UNKNOWN =                2;

  /* The deflate compression method */
export const Z_DEFLATED =               8;
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
