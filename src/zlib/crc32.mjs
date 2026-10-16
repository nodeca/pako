// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.

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

// Slicing-by-8 tables: 8 x 256 entries in one flat Uint32Array.
const makeTable = () => {
  const table = new Uint32Array(256 * 8);
  let c;

  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  for (let n = 0; n < 256; n++) {
    c = table[n];
    for (let k = 256; k < 256 * 8; k += 256) {
      c = table[c & 0xFF] ^ (c >>> 8);
      table[k + n] = c;
    }
  }

  return table;
};

const crcTable = makeTable();


const crc32 = (crc, buf, len, pos) => {
  const t = crcTable;
  const end = pos + len;
  let i = pos;

  crc ^= -1;

  // Process 8 bytes per iteration (slicing-by-8)
  for (const end8 = end - 7; i < end8; i += 8) {
    crc ^= buf[i] | (buf[i + 1] << 8) | (buf[i + 2] << 16) | (buf[i + 3] << 24);
    crc = t[1792 + (crc & 0xFF)] ^
          t[1536 + ((crc >>> 8) & 0xFF)] ^
          t[1280 + ((crc >>> 16) & 0xFF)] ^
          t[1024 + (crc >>> 24)] ^
          t[768 + buf[i + 4]] ^
          t[512 + buf[i + 5]] ^
          t[256 + buf[i + 6]] ^
          t[buf[i + 7]];
  }

  for (; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
};


export default crc32;
