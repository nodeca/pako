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
export var Z_NO_FLUSH =          0;
export var Z_PARTIAL_FLUSH =     1;
export var Z_SYNC_FLUSH =        2;
export var Z_FULL_FLUSH =        3;
export var Z_FINISH =            4;
export var Z_BLOCK =             5;
export var Z_TREES =             6;

/* Return codes for the compression/decompression functions. Negative values
* are errors, positive values are used for special but normal events.
*/
export var Z_OK =                0;
export var Z_STREAM_END =        1;
export var Z_NEED_DICT =         2;
export var Z_ERRNO =            -1;
export var Z_STREAM_ERROR =     -2;
export var Z_DATA_ERROR =       -3;
//export var Z_MEM_ERROR =      -4;
export var Z_BUF_ERROR =        -5;
//export var Z_VERSION_ERROR =  -6;

/* compression levels */
export var Z_NO_COMPRESSION =          0;
export var Z_BEST_SPEED =              1;
export var Z_BEST_COMPRESSION =        9;
export var Z_DEFAULT_COMPRESSION =    -1;


export var Z_FILTERED =                1;
export var Z_HUFFMAN_ONLY =            2;
export var Z_RLE =                     3;
export var Z_FIXED =                   4;
export var Z_DEFAULT_STRATEGY =        0;

/* Possible values of the data_type field (though see inflate()) */
export var Z_BINARY =                  0;
export var Z_TEXT =                    1;
//export var Z_ASCII =                 1; // = Z_TEXT (deprecated)
export var Z_UNKNOWN =                 2;

/* The deflate compression method */
export var Z_DEFLATED =                8;
//export var Z_NULL =                  null // Use -1 or null inline; depending on var type
