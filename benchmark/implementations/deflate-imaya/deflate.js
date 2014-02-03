/**
 * @license
 * zlib.js
 * JavaScript Zlib Library
 * https://github.com/imaya/zlib.js
 *
 * The MIT License
 *
 * Copyright (c) 2012 imaya
 *
 * `deflate` algorythm from Imaya's `zlib.js`. Manually sttipped to use as node's commonjs module.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


var Zlib = {};
Zlib.Util = {};


/**
 * @enum {number}
 */
Zlib.CompressionMethod = {
  STORE: 0,
  DEFLATE: 8
};

var USE_TYPEDARRAY = Uint16Array != undefined;

///////////////////////////////////////////////////////////////
// util.js

/**
 * Byte String ...... Byte Array ..........
 * @param {!string} str byte string.
 * @return {!Array.<number>} byte array.
 */
Zlib.Util.stringToByteArray = function(str) {
  /** @type {!Array.<(string|number)>} */
  var tmp = str.split('');
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  for (i = 0, il = tmp.length; i < il; i++) {
    tmp[i] = (tmp[i].charCodeAt(0) & 0xff) >>> 0;
  }

  return tmp;
};

///////////////////////////////////////////////////////////////
// adler32.js

/**
 * Adler32 ハッシュ値の作成
 * @param {!(Array|Uint8Array|string)} array 算出に使用する byte array.
 * @return {number} Adler32 ハッシュ値.
 */
Zlib.Adler32 = function(array) {
  if (typeof(array) === 'string') {
    array = Zlib.Util.stringToByteArray(array);
  }
  return Zlib.Adler32.update(1, array);
};

/**
 * Adler32 ハッシュ値の更新
 * @param {number} adler 現在のハッシュ値.
 * @param {!(Array|Uint8Array)} array 更新に使用する byte array.
 * @return {number} Adler32 ハッシュ値.
 */
Zlib.Adler32.update = function(adler, array) {
  /** @type {number} */
  var s1 = adler & 0xffff;
  /** @type {number} */
  var s2 = (adler >>> 16) & 0xffff;
  /** @type {number} array length */
  var len = array.length;
  /** @type {number} loop length (don't overflow) */
  var tlen;
  /** @type {number} array index */
  var i = 0;

  while (len > 0) {
    tlen = len > Zlib.Adler32.OptimizationParameter ?
      Zlib.Adler32.OptimizationParameter : len;
    len -= tlen;
    do {
      s1 += array[i++];
      s2 += s1;
    } while (--tlen);

    s1 %= 65521;
    s2 %= 65521;
  }

  return ((s2 << 16) | s1) >>> 0;
};

/**
 * Adler32 最適化パラメータ
 * 現状では 1024 程度が最適.
 * @see http://jsperf.com/adler-32-simple-vs-optimized/3
 * @define {number}
 */
Zlib.Adler32.OptimizationParameter = 1024;

///////////////////////////////////////////////////////////////
// bitstream.js

/**
 * ビットストリーム
 * @constructor
 * @param {!(Array|Uint8Array)=} buffer output buffer.
 * @param {number=} bufferPosition start buffer pointer.
 */
Zlib.BitStream = function(buffer, bufferPosition) {
  /** @type {number} buffer index. */
  this.index = typeof bufferPosition === 'number' ? bufferPosition : 0;
  /** @type {number} bit index. */
  this.bitindex = 0;
  /** @type {!(Array|Uint8Array)} bit-stream output buffer. */
  this.buffer = buffer instanceof (USE_TYPEDARRAY ? Uint8Array : Array) ?
    buffer :
    new (USE_TYPEDARRAY ? Uint8Array : Array)(Zlib.BitStream.DefaultBlockSize);

  // 入力された index が足りなかったら拡張するが、倍にしてもダメなら不正とする
  if (this.buffer.length * 2 <= this.index) {
    throw new Error("invalid index");
  } else if (this.buffer.length <= this.index) {
    this.expandBuffer();
  }
};

/**
 * デフォルトブロックサイズ.
 * @const
 * @type {number}
 */
Zlib.BitStream.DefaultBlockSize = 0x8000;

/**
 * expand buffer.
 * @return {!(Array|Uint8Array)} new buffer.
 */
Zlib.BitStream.prototype.expandBuffer = function() {
  /** @type {!(Array|Uint8Array)} old buffer. */
  var oldbuf = this.buffer;
  /** @type {number} loop counter. */
  var i;
  /** @type {number} loop limiter. */
  var il = oldbuf.length;
  /** @type {!(Array|Uint8Array)} new buffer. */
  var buffer =
    new (USE_TYPEDARRAY ? Uint8Array : Array)(il << 1);

  // copy buffer
  if (USE_TYPEDARRAY) {
    buffer.set(oldbuf);
  } else {
    // XXX: loop unrolling
    for (i = 0; i < il; ++i) {
      buffer[i] = oldbuf[i];
    }
  }

  return (this.buffer = buffer);
};


/**
 * 数値をビットで指定した数だけ書き込む.
 * @param {number} number 書き込む数値.
 * @param {number} n 書き込むビット数.
 * @param {boolean=} reverse 逆順に書き込むならば true.
 */
Zlib.BitStream.prototype.writeBits = function(number, n, reverse) {
  var buffer = this.buffer;
  var index = this.index;
  var bitindex = this.bitindex;

  /** @type {number} current octet. */
  var current = buffer[index];
  /** @type {number} loop counter. */
  var i;

  /**
   * 32-bit 整数のビット順を逆にする
   * @param {number} n 32-bit integer.
   * @return {number} reversed 32-bit integer.
   * @private
   */
  function rev32_(n) {
    return (Zlib.BitStream.ReverseTable[n & 0xFF] << 24) |
      (Zlib.BitStream.ReverseTable[n >>> 8 & 0xFF] << 16) |
      (Zlib.BitStream.ReverseTable[n >>> 16 & 0xFF] << 8) |
      Zlib.BitStream.ReverseTable[n >>> 24 & 0xFF];
  }

  if (reverse && n > 1) {
    number = n > 8 ?
      rev32_(number) >> (32 - n) :
      Zlib.BitStream.ReverseTable[number] >> (8 - n);
  }

  // Byte 境界を超えないとき
  if (n + bitindex < 8) {
    current = (current << n) | number;
    bitindex += n;
    // Byte 境界を超えるとき
  } else {
    for (i = 0; i < n; ++i) {
      current = (current << 1) | ((number >> n - i - 1) & 1);

      // next byte
      if (++bitindex === 8) {
        bitindex = 0;
        buffer[index++] = Zlib.BitStream.ReverseTable[current];
        current = 0;

        // expand
        if (index === buffer.length) {
          buffer = this.expandBuffer();
        }
      }
    }
  }
  buffer[index] = current;

  this.buffer = buffer;
  this.bitindex = bitindex;
  this.index = index;
};


/**
 * ストリームの終端処理を行う
 * @return {!(Array|Uint8Array)} 終端処理後のバッファを byte array で返す.
 */
Zlib.BitStream.prototype.finish = function() {
  var buffer = this.buffer;
  var index = this.index;

  /** @type {!(Array|Uint8Array)} output buffer. */
  var output;

  // bitindex が 0 の時は余分に index が進んでいる状態
  if (this.bitindex > 0) {
    buffer[index] <<= 8 - this.bitindex;
    buffer[index] = Zlib.BitStream.ReverseTable[buffer[index]];
    index++;
  }

  // array truncation
  if (USE_TYPEDARRAY) {
    output = buffer.subarray(0, index);
  } else {
    buffer.length = index;
    output = buffer;
  }

  return output;
};

/**
 * 0-255 のビット順を反転したテーブル
 * @const
 * @type {!(Uint8Array|Array.<number>)}
 */
Zlib.BitStream.ReverseTable = (function(table) {
  return table;
})((function() {
    /** @type {!(Array|Uint8Array)} reverse table. */
    var table = new (USE_TYPEDARRAY ? Uint8Array : Array)(256);
    /** @type {number} loop counter. */
    var i;
    /** @type {number} loop limiter. */
    var il;

    // generate
    for (i = 0; i < 256; ++i) {
      table[i] = (function(n) {
        var r = n;
        var s = 7;

        for (n >>>= 1; n; n >>>= 1) {
          r <<= 1;
          r |= n & 1;
          --s;
        }

        return (r << s & 0xff) >>> 0;
      })(i);
    }

    return table;
})());

///////////////////////////////////////////////////////////////
// heap.js

/**
 * カスタムハフマン符号で使用するヒープ実装
 * @param {number} length ヒープサイズ.
 * @constructor
 */
Zlib.Heap = function(length) {
  this.buffer = new (USE_TYPEDARRAY ? Uint16Array : Array)(length * 2);
  this.length = 0;
};

/**
 * 親ノードの index 取得
 * @param {number} index 子ノードの index.
 * @return {number} 親ノードの index.
 *
 */
Zlib.Heap.prototype.getParent = function(index) {
  return ((index - 2) / 4 | 0) * 2;
};

/**
 * 子ノードの index 取得
 * @param {number} index 親ノードの index.
 * @return {number} 子ノードの index.
 */
Zlib.Heap.prototype.getChild = function(index) {
  return 2 * index + 2;
};

/**
 * Heap に値を追加する
 * @param {number} index キー index.
 * @param {number} value 値.
 * @return {number} 現在のヒープ長.
 */
Zlib.Heap.prototype.push = function(index, value) {
  var current, parent,
    heap = this.buffer,
    swap;

  current = this.length;
  heap[this.length++] = value;
  heap[this.length++] = index;

  // ルートノードにたどり着くまで入れ替えを試みる
  while (current > 0) {
    parent = this.getParent(current);

    // 親ノードと比較して親の方が小さければ入れ替える
    if (heap[current] > heap[parent]) {
      swap = heap[current];
      heap[current] = heap[parent];
      heap[parent] = swap;

      swap = heap[current + 1];
      heap[current + 1] = heap[parent + 1];
      heap[parent + 1] = swap;

      current = parent;
      // 入れ替えが必要なくなったらそこで抜ける
    } else {
      break;
    }
  }

  return this.length;
};

/**
 * Heapから一番大きい値を返す
 * @return {{index: number, value: number, length: number}} {index: キーindex,
*     value: 値, length: ヒープ長} の Object.
 */
Zlib.Heap.prototype.pop = function() {
  var index, value,
    heap = this.buffer, swap,
    current, parent;

  value = heap[0];
  index = heap[1];

  // 後ろから値を取る
  this.length -= 2;
  heap[0] = heap[this.length];
  heap[1] = heap[this.length + 1];

  parent = 0;
  // ルートノードから下がっていく
  while (true) {
    current = this.getChild(parent);

    // 範囲チェック
    if (current >= this.length) {
      break;
    }

    // 隣のノードと比較して、隣の方が値が大きければ隣を現在ノードとして選択
    if (current + 2 < this.length && heap[current + 2] > heap[current]) {
      current += 2;
    }

    // 親ノードと比較して親の方が小さい場合は入れ替える
    if (heap[current] > heap[parent]) {
      swap = heap[parent];
      heap[parent] = heap[current];
      heap[current] = swap;

      swap = heap[parent + 1];
      heap[parent + 1] = heap[current + 1];
      heap[current + 1] = swap;
    } else {
      break;
    }

    parent = current;
  }

  return {index: index, value: value, length: this.length};
};

///////////////////////////////////////////////////////////////
// rawdeflate.js

/**
 * Raw Deflate 実装
 *
 * @constructor
 * @param {!(Array.<number>|Uint8Array)} input 符号化する対象のバッファ.
 * @param {Object=} opt_params option parameters.
 *
 * typed array が使用可能なとき、outputBuffer が Array は自動的に Uint8Array に
 * 変換されます.
 * 別のオブジェクトになるため出力バッファを参照している変数などは
 * 更新する必要があります.
 */
Zlib.RawDeflate = function(input, opt_params) {
  /** @type {Zlib.RawDeflate.CompressionType} */
  this.compressionType = Zlib.RawDeflate.CompressionType.DYNAMIC;
  /** @type {number} */
  this.lazy = 0;
  /** @type {!(Array.<number>|Uint32Array)} */
  this.freqsLitLen;
  /** @type {!(Array.<number>|Uint32Array)} */
  this.freqsDist;
  /** @type {!(Array.<number>|Uint8Array)} */
  this.input =
    (USE_TYPEDARRAY && input instanceof Array) ? new Uint8Array(input) : input;
  /** @type {!(Array.<number>|Uint8Array)} output output buffer. */
  this.output;
  /** @type {number} pos output buffer position. */
  this.op = 0;

  // option parameters
  if (opt_params) {
    if (opt_params['lazy']) {
      this.lazy = opt_params['lazy'];
    }
    if (typeof opt_params['compressionType'] === 'number') {
      this.compressionType = opt_params['compressionType'];
    }
    if (opt_params['outputBuffer']) {
      this.output =
        (USE_TYPEDARRAY && opt_params['outputBuffer'] instanceof Array) ?
        new Uint8Array(opt_params['outputBuffer']) : opt_params['outputBuffer'];
    }
    if (typeof opt_params['outputIndex'] === 'number') {
      this.op = opt_params['outputIndex'];
    }
  }

  if (!this.output) {
    this.output = new (USE_TYPEDARRAY ? Uint8Array : Array)(0x8000);
  }
};

/**
 * @enum {number}
 */
Zlib.RawDeflate.CompressionType = {
  NONE: 0,
  FIXED: 1,
  DYNAMIC: 2,
  RESERVED: 3
};


/**
 * LZ77 の最小マッチ長
 * @const
 * @type {number}
 */
Zlib.RawDeflate.Lz77MinLength = 3;

/**
 * LZ77 の最大マッチ長
 * @const
 * @type {number}
 */
Zlib.RawDeflate.Lz77MaxLength = 258;

/**
 * LZ77 のウィンドウサイズ
 * @const
 * @type {number}
 */
Zlib.RawDeflate.WindowSize = 0x8000;

/**
 * 最長の符号長
 * @const
 * @type {number}
 */
Zlib.RawDeflate.MaxCodeLength = 16;

/**
 * ハフマン符号の最大数値
 * @const
 * @type {number}
 */
Zlib.RawDeflate.HUFMAX = 286;

/**
 * 固定ハフマン符号の符号化テーブル
 * @const
 * @type {Array.<Array.<number, number>>}
 */
Zlib.RawDeflate.FixedHuffmanTable = (function() {
  var table = [], i;

  for (i = 0; i < 288; i++) {
    switch (true) {
      case (i <= 143): table.push([i       + 0x030, 8]); break;
      case (i <= 255): table.push([i - 144 + 0x190, 9]); break;
      case (i <= 279): table.push([i - 256 + 0x000, 7]); break;
      case (i <= 287): table.push([i - 280 + 0x0C0, 8]); break;
      default:
        throw 'invalid literal: ' + i;
    }
  }

  return table;
})();

/**
 * DEFLATE ブロックの作成
 * @return {!(Array.<number>|Uint8Array)} 圧縮済み byte array.
 */
Zlib.RawDeflate.prototype.compress = function() {
  /** @type {!(Array.<number>|Uint8Array)} */
  var blockArray;
  /** @type {number} */
  var position;
  /** @type {number} */
  var length;

  var input = this.input;

  // compression
  switch (this.compressionType) {
    case Zlib.RawDeflate.CompressionType.NONE:
      // each 65535-Byte (length header: 16-bit)
      for (position = 0, length = input.length; position < length;) {
        blockArray = USE_TYPEDARRAY ?
          input.subarray(position, position + 0xffff) :
          input.slice(position, position + 0xffff);
        position += blockArray.length;
        this.makeNocompressBlock(blockArray, (position === length));
      }
      break;
    case Zlib.RawDeflate.CompressionType.FIXED:
      this.output = this.makeFixedHuffmanBlock(input, true);
      this.op = this.output.length;
      break;
    case Zlib.RawDeflate.CompressionType.DYNAMIC:
      this.output = this.makeDynamicHuffmanBlock(input, true);
      this.op = this.output.length;
      break;
    default:
      throw 'invalid compression type';
  }

  return this.output;
};

/**
 * 非圧縮ブロックの作成
 * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
 * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
 * @return {!(Array.<number>|Uint8Array)} 非圧縮ブロック byte array.
 */
Zlib.RawDeflate.prototype.makeNocompressBlock =
function(blockArray, isFinalBlock) {
  /** @type {number} */
  var bfinal;
  /** @type {Zlib.RawDeflate.CompressionType} */
  var btype;
  /** @type {number} */
  var len;
  /** @type {number} */
  var nlen;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  var output = this.output;
  var op = this.op;

  // expand buffer
  if (USE_TYPEDARRAY) {
    output = new Uint8Array(this.output.buffer);
    while (output.length <= op + blockArray.length + 5) {
      output = new Uint8Array(output.length << 1);
    }
    output.set(this.output);
  }

  // header
  bfinal = isFinalBlock ? 1 : 0;
  btype = Zlib.RawDeflate.CompressionType.NONE;
  output[op++] = (bfinal) | (btype << 1);

  // length
  len = blockArray.length;
  nlen = (~len + 0x10000) & 0xffff;
  output[op++] =          len & 0xff;
  output[op++] =  (len >>> 8) & 0xff;
  output[op++] =         nlen & 0xff;
  output[op++] = (nlen >>> 8) & 0xff;

  // copy buffer
  if (USE_TYPEDARRAY) {
     output.set(blockArray, op);
     op += blockArray.length;
     output = output.subarray(0, op);
  } else {
    for (i = 0, il = blockArray.length; i < il; ++i) {
      output[op++] = blockArray[i];
    }
    output.length = op;
  }

  this.op = op;
  this.output = output;

  return output;
};

/**
 * 固定ハフマンブロックの作成
 * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
 * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
 * @return {!(Array.<number>|Uint8Array)} 固定ハフマン符号化ブロック byte array.
 */
Zlib.RawDeflate.prototype.makeFixedHuffmanBlock =
function(blockArray, isFinalBlock) {
  /** @type {Zlib.BitStream} */
  var stream = new Zlib.BitStream(USE_TYPEDARRAY ?
    new Uint8Array(this.output.buffer) : this.output, this.op);
  /** @type {number} */
  var bfinal;
  /** @type {Zlib.RawDeflate.CompressionType} */
  var btype;
  /** @type {!(Array.<number>|Uint16Array)} */
  var data;

  // header
  bfinal = isFinalBlock ? 1 : 0;
  btype = Zlib.RawDeflate.CompressionType.FIXED;

  stream.writeBits(bfinal, 1, true);
  stream.writeBits(btype, 2, true);

  data = this.lz77(blockArray);
  this.fixedHuffman(data, stream);

  return stream.finish();
};

/**
 * 動的ハフマンブロックの作成
 * @param {!(Array.<number>|Uint8Array)} blockArray ブロックデータ byte array.
 * @param {!boolean} isFinalBlock 最後のブロックならばtrue.
 * @return {!(Array.<number>|Uint8Array)} 動的ハフマン符号ブロック byte array.
 */
Zlib.RawDeflate.prototype.makeDynamicHuffmanBlock =
function(blockArray, isFinalBlock) {
  /** @type {Zlib.BitStream} */
  var stream = new Zlib.BitStream(USE_TYPEDARRAY ?
    new Uint8Array(this.output.buffer) : this.output, this.op);
  /** @type {number} */
  var bfinal;
  /** @type {Zlib.RawDeflate.CompressionType} */
  var btype;
  /** @type {!(Array.<number>|Uint16Array)} */
  var data;
  /** @type {number} */
  var hlit;
  /** @type {number} */
  var hdist;
  /** @type {number} */
  var hclen;
  /** @const @type {Array.<number>} */
  var hclenOrder =
        [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  /** @type {!(Array.<number>|Uint8Array)} */
  var litLenLengths;
  /** @type {!(Array.<number>|Uint16Array)} */
  var litLenCodes;
  /** @type {!(Array.<number>|Uint8Array)} */
  var distLengths;
  /** @type {!(Array.<number>|Uint16Array)} */
  var distCodes;
  /** @type {{
   *   codes: !(Array.<number>|Uint32Array),
   *   freqs: !(Array.<number>|Uint32Array)
   * }} */
  var treeSymbols;
  /** @type {!(Array.<number>|Uint8Array)} */
  var treeLengths;
  /** @type {Array} */
  var transLengths = new Array(19);
  /** @type {!(Array.<number>|Uint16Array)} */
  var treeCodes;
  /** @type {number} */
  var code;
  /** @type {number} */
  var bitlen;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;

  // header
  bfinal = isFinalBlock ? 1 : 0;
  btype = Zlib.RawDeflate.CompressionType.DYNAMIC;

  stream.writeBits(bfinal, 1, true);
  stream.writeBits(btype, 2, true);

  data = this.lz77(blockArray);

  // リテラル・長さ, 距離のハフマン符号と符号長の算出
  litLenLengths = this.getLengths_(this.freqsLitLen, 15);
  litLenCodes = this.getCodesFromLengths_(litLenLengths);
  distLengths = this.getLengths_(this.freqsDist, 7);
  distCodes = this.getCodesFromLengths_(distLengths);

  // HLIT, HDIST の決定
  for (hlit = 286; hlit > 257 && litLenLengths[hlit - 1] === 0; hlit--) {}
  for (hdist = 30; hdist > 1 && distLengths[hdist - 1] === 0; hdist--) {}

  // HCLEN
  treeSymbols =
    this.getTreeSymbols_(hlit, litLenLengths, hdist, distLengths);
  treeLengths = this.getLengths_(treeSymbols.freqs, 7);
  for (i = 0; i < 19; i++) {
    transLengths[i] = treeLengths[hclenOrder[i]];
  }
  for (hclen = 19; hclen > 4 && transLengths[hclen - 1] === 0; hclen--) {}

  treeCodes = this.getCodesFromLengths_(treeLengths);

  // 出力
  stream.writeBits(hlit - 257, 5, true);
  stream.writeBits(hdist - 1, 5, true);
  stream.writeBits(hclen - 4, 4, true);
  for (i = 0; i < hclen; i++) {
    stream.writeBits(transLengths[i], 3, true);
  }

  // ツリーの出力
  for (i = 0, il = treeSymbols.codes.length; i < il; i++) {
    code = treeSymbols.codes[i];

    stream.writeBits(treeCodes[code], treeLengths[code], true);

    // extra bits
    if (code >= 16) {
      i++;
      switch (code) {
        case 16: bitlen = 2; break;
        case 17: bitlen = 3; break;
        case 18: bitlen = 7; break;
        default:
          throw 'invalid code: ' + code;
      }

      stream.writeBits(treeSymbols.codes[i], bitlen, true);
    }
  }

  this.dynamicHuffman(
    data,
    [litLenCodes, litLenLengths],
    [distCodes, distLengths],
    stream
  );

  return stream.finish();
};


/**
 * 動的ハフマン符号化(カスタムハフマンテーブル)
 * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
 * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
 * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
 */
Zlib.RawDeflate.prototype.dynamicHuffman =
function(dataArray, litLen, dist, stream) {
  /** @type {number} */
  var index;
  /** @type {number} */
  var length;
  /** @type {number} */
  var literal;
  /** @type {number} */
  var code;
  /** @type {number} */
  var litLenCodes;
  /** @type {number} */
  var litLenLengths;
  /** @type {number} */
  var distCodes;
  /** @type {number} */
  var distLengths;

  litLenCodes = litLen[0];
  litLenLengths = litLen[1];
  distCodes = dist[0];
  distLengths = dist[1];

  // 符号を BitStream に書き込んでいく
  for (index = 0, length = dataArray.length; index < length; ++index) {
    literal = dataArray[index];

    // literal or length
    stream.writeBits(litLenCodes[literal], litLenLengths[literal], true);

    // 長さ・距離符号
    if (literal > 256) {
      // length extra
      stream.writeBits(dataArray[++index], dataArray[++index], true);
      // distance
      code = dataArray[++index];
      stream.writeBits(distCodes[code], distLengths[code], true);
      // distance extra
      stream.writeBits(dataArray[++index], dataArray[++index], true);
    // 終端
    } else if (literal === 256) {
      break;
    }
  }

  return stream;
};

/**
 * 固定ハフマン符号化
 * @param {!(Array.<number>|Uint16Array)} dataArray LZ77 符号化済み byte array.
 * @param {!Zlib.BitStream} stream 書き込み用ビットストリーム.
 * @return {!Zlib.BitStream} ハフマン符号化済みビットストリームオブジェクト.
 */
Zlib.RawDeflate.prototype.fixedHuffman = function(dataArray, stream) {
  /** @type {number} */
  var index;
  /** @type {number} */
  var length;
  /** @type {number} */
  var literal;

  // 符号を BitStream に書き込んでいく
  for (index = 0, length = dataArray.length; index < length; index++) {
    literal = dataArray[index];

    // 符号の書き込み
    Zlib.BitStream.prototype.writeBits.apply(
      stream,
      Zlib.RawDeflate.FixedHuffmanTable[literal]
    );

    // 長さ・距離符号
    if (literal > 0x100) {
      // length extra
      stream.writeBits(dataArray[++index], dataArray[++index], true);
      // distance
      stream.writeBits(dataArray[++index], 5);
      // distance extra
      stream.writeBits(dataArray[++index], dataArray[++index], true);
    // 終端
    } else if (literal === 0x100) {
      break;
    }
  }

  return stream;
};

/**
 * マッチ情報
 * @param {!number} length マッチした長さ.
 * @param {!number} backwardDistance マッチ位置との距離.
 * @constructor
 */
Zlib.RawDeflate.Lz77Match = function(length, backwardDistance) {
  /** @type {number} match length. */
  this.length = length;
  /** @type {number} backward distance. */
  this.backwardDistance = backwardDistance;
};

/**
 * 長さ符号テーブル.
 * [コード, 拡張ビット, 拡張ビット長] の配列となっている.
 * @const
 * @type {!(Array.<number>|Uint32Array)}
 */
Zlib.RawDeflate.Lz77Match.LengthCodeTable = (function(table) {
  return USE_TYPEDARRAY ? new Uint32Array(table) : table;
})((function() {
  /** @type {!Array} */
  var table = [];
  /** @type {number} */
  var i;
  /** @type {!Array.<number>} */
  var c;

  for (i = 3; i <= 258; i++) {
    c = code(i);
    table[i] = (c[2] << 24) | (c[1] << 16) | c[0];
  }

  /**
   * @param {number} length lz77 length.
   * @return {!Array.<number>} lz77 codes.
   */
  function code(length) {
    switch (true) {
      case (length === 3): return [257, length - 3, 0]; break;
      case (length === 4): return [258, length - 4, 0]; break;
      case (length === 5): return [259, length - 5, 0]; break;
      case (length === 6): return [260, length - 6, 0]; break;
      case (length === 7): return [261, length - 7, 0]; break;
      case (length === 8): return [262, length - 8, 0]; break;
      case (length === 9): return [263, length - 9, 0]; break;
      case (length === 10): return [264, length - 10, 0]; break;
      case (length <= 12): return [265, length - 11, 1]; break;
      case (length <= 14): return [266, length - 13, 1]; break;
      case (length <= 16): return [267, length - 15, 1]; break;
      case (length <= 18): return [268, length - 17, 1]; break;
      case (length <= 22): return [269, length - 19, 2]; break;
      case (length <= 26): return [270, length - 23, 2]; break;
      case (length <= 30): return [271, length - 27, 2]; break;
      case (length <= 34): return [272, length - 31, 2]; break;
      case (length <= 42): return [273, length - 35, 3]; break;
      case (length <= 50): return [274, length - 43, 3]; break;
      case (length <= 58): return [275, length - 51, 3]; break;
      case (length <= 66): return [276, length - 59, 3]; break;
      case (length <= 82): return [277, length - 67, 4]; break;
      case (length <= 98): return [278, length - 83, 4]; break;
      case (length <= 114): return [279, length - 99, 4]; break;
      case (length <= 130): return [280, length - 115, 4]; break;
      case (length <= 162): return [281, length - 131, 5]; break;
      case (length <= 194): return [282, length - 163, 5]; break;
      case (length <= 226): return [283, length - 195, 5]; break;
      case (length <= 257): return [284, length - 227, 5]; break;
      case (length === 258): return [285, length - 258, 0]; break;
      default: throw 'invalid length: ' + length;
    }
  };

  return table;
})());

/**
 * 距離符号テーブル
 * @param {!number} dist 距離.
 * @return {!Array.<number>} コード、拡張ビット、拡張ビット長の配列.
 * @private
 */
Zlib.RawDeflate.Lz77Match.prototype.getDistanceCode_ = function(dist) {
  /** @type {!Array.<number>} distance code table. */
  var r;

  switch (true) {
    case (dist === 1): r = [0, dist - 1, 0]; break;
    case (dist === 2): r = [1, dist - 2, 0]; break;
    case (dist === 3): r = [2, dist - 3, 0]; break;
    case (dist === 4): r = [3, dist - 4, 0]; break;
    case (dist <= 6): r = [4, dist - 5, 1]; break;
    case (dist <= 8): r = [5, dist - 7, 1]; break;
    case (dist <= 12): r = [6, dist - 9, 2]; break;
    case (dist <= 16): r = [7, dist - 13, 2]; break;
    case (dist <= 24): r = [8, dist - 17, 3]; break;
    case (dist <= 32): r = [9, dist - 25, 3]; break;
    case (dist <= 48): r = [10, dist - 33, 4]; break;
    case (dist <= 64): r = [11, dist - 49, 4]; break;
    case (dist <= 96): r = [12, dist - 65, 5]; break;
    case (dist <= 128): r = [13, dist - 97, 5]; break;
    case (dist <= 192): r = [14, dist - 129, 6]; break;
    case (dist <= 256): r = [15, dist - 193, 6]; break;
    case (dist <= 384): r = [16, dist - 257, 7]; break;
    case (dist <= 512): r = [17, dist - 385, 7]; break;
    case (dist <= 768): r = [18, dist - 513, 8]; break;
    case (dist <= 1024): r = [19, dist - 769, 8]; break;
    case (dist <= 1536): r = [20, dist - 1025, 9]; break;
    case (dist <= 2048): r = [21, dist - 1537, 9]; break;
    case (dist <= 3072): r = [22, dist - 2049, 10]; break;
    case (dist <= 4096): r = [23, dist - 3073, 10]; break;
    case (dist <= 6144): r = [24, dist - 4097, 11]; break;
    case (dist <= 8192): r = [25, dist - 6145, 11]; break;
    case (dist <= 12288): r = [26, dist - 8193, 12]; break;
    case (dist <= 16384): r = [27, dist - 12289, 12]; break;
    case (dist <= 24576): r = [28, dist - 16385, 13]; break;
    case (dist <= 32768): r = [29, dist - 24577, 13]; break;
    default: throw 'invalid distance';
  }

  return r;
};

/**
 * マッチ情報を LZ77 符号化配列で返す.
 * なお、ここでは以下の内部仕様で符号化している
 * [ CODE, EXTRA-BIT-LEN, EXTRA, CODE, EXTRA-BIT-LEN, EXTRA ]
 * @return {!Array.<number>} LZ77 符号化 byte array.
 */
Zlib.RawDeflate.Lz77Match.prototype.toLz77Array = function() {
  /** @type {number} */
  var length = this.length;
  /** @type {number} */
  var dist = this.backwardDistance;
  /** @type {Array} */
  var codeArray = [];
  /** @type {number} */
  var pos = 0;
  /** @type {!Array.<number>} */
  var code;

  // length
  code = Zlib.RawDeflate.Lz77Match.LengthCodeTable[length];
  codeArray[pos++] = code & 0xffff;
  codeArray[pos++] = (code >> 16) & 0xff;
  codeArray[pos++] = code >> 24;

  // distance
  code = this.getDistanceCode_(dist);
  codeArray[pos++] = code[0];
  codeArray[pos++] = code[1];
  codeArray[pos++] = code[2];

  return codeArray;
};

/**
 * LZ77 実装
 * @param {!(Array.<number>|Uint8Array)} dataArray LZ77 符号化するバイト配列.
 * @return {!(Array.<number>|Uint16Array)} LZ77 符号化した配列.
 */
Zlib.RawDeflate.prototype.lz77 = function(dataArray) {
  /** @type {number} input position */
  var position;
  /** @type {number} input length */
  var length;
  /** @type {number} loop counter */
  var i;
  /** @type {number} loop limiter */
  var il;
  /** @type {number} chained-hash-table key */
  var matchKey;
  /** @type {Object.<number, Array.<number>>} chained-hash-table */
  var table = {};
  /** @const @type {number} */
  var windowSize = Zlib.RawDeflate.WindowSize;
  /** @type {Array.<number>} match list */
  var matchList;
  /** @type {Zlib.RawDeflate.Lz77Match} longest match */
  var longestMatch;
  /** @type {Zlib.RawDeflate.Lz77Match} previous longest match */
  var prevMatch;
  /** @type {!(Array.<number>|Uint16Array)} lz77 buffer */
  var lz77buf = USE_TYPEDARRAY ?
    new Uint16Array(dataArray.length * 2) : new Array();
  /** @type {number} lz77 output buffer pointer */
  var pos = 0;
  /** @type {number} lz77 skip length */
  var skipLength = 0;
  /** @type {!(Array.<number>|Uint32Array)} */
  var freqsLitLen = new (USE_TYPEDARRAY ? Uint32Array : Array)(286);
  /** @type {!(Array.<number>|Uint32Array)} */
  var freqsDist = new (USE_TYPEDARRAY ? Uint32Array : Array)(30);
  /** @type {number} */
  var lazy = this.lazy;
  /** @type {*} temporary variable */
  var tmp;

  // 初期化
  if (!USE_TYPEDARRAY) {
    for (i = 0; i <= 285;) { freqsLitLen[i++] = 0; }
    for (i = 0; i <= 29;) { freqsDist[i++] = 0; }
  }
  freqsLitLen[256] = 1; // EOB の最低出現回数は 1

  /**
   * マッチデータの書き込み
   * @param {Zlib.RawDeflate.Lz77Match} match LZ77 Match data.
   * @param {!number} offset スキップ開始位置(相対指定).
   * @private
   */
  function writeMatch(match, offset) {
    /** @type {Array.<number>} */
    var lz77Array = match.toLz77Array();
    /** @type {number} */
    var i;
    /** @type {number} */
    var il;

    for (i = 0, il = lz77Array.length; i < il; ++i) {
      lz77buf[pos++] = lz77Array[i];
    }
    freqsLitLen[lz77Array[0]]++;
    freqsDist[lz77Array[3]]++;
    skipLength = match.length + offset - 1;
    prevMatch = null;
  }

  // LZ77 符号化
  for (position = 0, length = dataArray.length; position < length; ++position) {
    // ハッシュキーの作成
    for (matchKey = 0, i = 0, il = Zlib.RawDeflate.Lz77MinLength; i < il; ++i) {
      if (position + i === length) {
        break;
      }
      matchKey = (matchKey << 8) | dataArray[position + i];
    }

    // テーブルが未定義だったら作成する
    if (table[matchKey] === void 0) { table[matchKey] = []; }
    matchList = table[matchKey];

    // skip
    if (skipLength-- > 0) {
      matchList.push(position);
      continue;
    }

    // マッチテーブルの更新 (最大戻り距離を超えているものを削除する)
    while (matchList.length > 0 && position - matchList[0] > windowSize) {
      matchList.shift();
    }

    // データ末尾でマッチしようがない場合はそのまま流しこむ
    if (position + Zlib.RawDeflate.Lz77MinLength >= length) {
      if (prevMatch) {
        writeMatch(prevMatch, -1);
      }

      for (i = 0, il = length - position; i < il; ++i) {
        tmp = dataArray[position + i];
        lz77buf[pos++] = tmp;
        ++freqsLitLen[tmp];
      }
      break;
    }

    // マッチ候補から最長のものを探す
    if (matchList.length > 0) {
      longestMatch = this.searchLongestMatch_(dataArray, position, matchList);

      if (prevMatch) {
        // 現在のマッチの方が前回のマッチよりも長い
        if (prevMatch.length < longestMatch.length) {
          // write previous literal
          tmp = dataArray[position - 1];
          lz77buf[pos++] = tmp;
          ++freqsLitLen[tmp];

          // write current match
          writeMatch(longestMatch, 0);
        } else {
          // write previous match
          writeMatch(prevMatch, -1);
        }
      } else if (longestMatch.length < lazy) {
        prevMatch = longestMatch;
      } else {
        writeMatch(longestMatch, 0);
      }
    // 前回マッチしていて今回マッチがなかったら前回のを採用
    } else if (prevMatch) {
      writeMatch(prevMatch, -1);
    } else {
      tmp = dataArray[position];
      lz77buf[pos++] = tmp;
      ++freqsLitLen[tmp];
    }

    matchList.push(position); // マッチテーブルに現在の位置を保存
  }

  // 終端処理
  lz77buf[pos++] = 256;
  freqsLitLen[256]++;
  this.freqsLitLen = freqsLitLen;
  this.freqsDist = freqsDist;

  return /** @type {!(Uint16Array|Array.<number>)} */ (
    USE_TYPEDARRAY ?  lz77buf.subarray(0, pos) : lz77buf
  );
};

/**
 * マッチした候補の中から最長一致を探す
 * @param {!Object} data plain data byte array.
 * @param {!number} position plain data byte array position.
 * @param {!Array.<number>} matchList 候補となる位置の配列.
 * @return {!Zlib.RawDeflate.Lz77Match} 最長かつ最短距離のマッチオブジェクト.
 * @private
 */
Zlib.RawDeflate.prototype.searchLongestMatch_ =
function(data, position, matchList) {
  var match,
      currentMatch,
      matchMax = 0, matchLength,
      i, j, l, dl = data.length;

  // 候補を後ろから 1 つずつ絞り込んでゆく
  permatch:
  for (i = 0, l = matchList.length; i < l; i++) {
    match = matchList[l - i - 1];
    matchLength = Zlib.RawDeflate.Lz77MinLength;

    // 前回までの最長一致を末尾から一致検索する
    if (matchMax > Zlib.RawDeflate.Lz77MinLength) {
      for (j = matchMax; j > Zlib.RawDeflate.Lz77MinLength; j--) {
        if (data[match + j - 1] !== data[position + j - 1]) {
          continue permatch;
        }
      }
      matchLength = matchMax;
    }

    // 最長一致探索
    while (matchLength < Zlib.RawDeflate.Lz77MaxLength &&
           position + matchLength < dl &&
           data[match + matchLength] === data[position + matchLength]) {
      ++matchLength;
    }

    // マッチ長が同じ場合は後方を優先
    if (matchLength > matchMax) {
      currentMatch = match;
      matchMax = matchLength;
    }

    // 最長が確定したら後の処理は省略
    if (matchLength === Zlib.RawDeflate.Lz77MaxLength) {
      break;
    }
  }

  return new Zlib.RawDeflate.Lz77Match(matchMax, position - currentMatch);
};

/**
 * Tree-Transmit Symbols の算出
 * reference: PuTTY Deflate implementation
 * @param {number} hlit HLIT.
 * @param {!(Array.<number>|Uint8Array)} litlenLengths リテラルと長さ符号の符号長配列.
 * @param {number} hdist HDIST.
 * @param {!(Array.<number>|Uint8Array)} distLengths 距離符号の符号長配列.
 * @return {{
 *   codes: !(Array.<number>|Uint32Array),
 *   freqs: !(Array.<number>|Uint32Array)
 * }} Tree-Transmit Symbols.
 */
Zlib.RawDeflate.prototype.getTreeSymbols_ =
function(hlit, litlenLengths, hdist, distLengths) {
  var src = new (USE_TYPEDARRAY ? Uint32Array : Array)(hlit + hdist),
      i, j, runLength, l, length,
      result = new (USE_TYPEDARRAY ? Uint32Array : Array)(286 + 30),
      nResult,
      rpt,
      freqs = new (USE_TYPEDARRAY ? Uint8Array : Array)(19);

  j = 0;
  for (i = 0; i < hlit; i++) {
    src[j++] = litlenLengths[i];
  }
  for (i = 0; i < hdist; i++) {
    src[j++] = distLengths[i];
  }

  // 初期化
  if (!USE_TYPEDARRAY) {
    for (i = 0, l = freqs.length; i < l; ++i) {
      freqs[i] = 0;
    }
  }

  // 符号化
  nResult = 0;
  for (i = 0, l = src.length; i < l; i += j) {
    // Run Length Encoding
    for (j = 1; i + j < l && src[i + j] === src[i]; ++j) {}

    runLength = j;

    if (src[i] === 0) {
      // 0 の繰り返しが 3 回未満ならばそのまま
      if (runLength < 3) {
        while (runLength-- > 0) {
          result[nResult++] = 0;
          freqs[0]++;
        }
      } else {
        while (runLength > 0) {
          // 繰り返しは最大 138 までなので切り詰める
          rpt = (runLength < 138 ? runLength : 138);

          if (rpt > runLength - 3 && rpt < runLength) {
            rpt = runLength - 3;
          }

          // 3-10 回 -> 17
          if (rpt <= 10) {
            result[nResult++] = 17;
            result[nResult++] = rpt - 3;
            freqs[17]++;
          // 11-138 回 -> 18
          } else {
            result[nResult++] = 18;
            result[nResult++] = rpt - 11;
            freqs[18]++;
          }

          runLength -= rpt;
        }
      }
    } else {
      result[nResult++] = src[i];
      freqs[src[i]]++;
      runLength--;

      // 繰り返し回数が3回未満ならばランレングス符号は要らない
      if (runLength < 3) {
        while (runLength-- > 0) {
          result[nResult++] = src[i];
          freqs[src[i]]++;
        }
      // 3 回以上ならばランレングス符号化
      } else {
        while (runLength > 0) {
          // runLengthを 3-6 で分割
          rpt = (runLength < 6 ? runLength : 6);

          if (rpt > runLength - 3 && rpt < runLength) {
            rpt = runLength - 3;
          }

          result[nResult++] = 16;
          result[nResult++] = rpt - 3;
          freqs[16]++;

          runLength -= rpt;
        }
      }
    }
  }

  return {
    codes:
      USE_TYPEDARRAY ? result.subarray(0, nResult) : result.slice(0, nResult),
    freqs: freqs
  };
};

/**
 * ハフマン符号の長さを取得する
 * @param {!(Array.<number>|Uint32Array)} freqs 出現カウント.
 * @param {number} limit 符号長の制限.
 * @return {!(Array.<number>|Uint8Array)} 符号長配列.
 * @private
 */
Zlib.RawDeflate.prototype.getLengths_ = function(freqs, limit) {
  /** @type {number} */
  var nSymbols = freqs.length;
  /** @type {Zlib.Heap} */
  var heap = new Zlib.Heap(2 * Zlib.RawDeflate.HUFMAX);
  /** @type {!(Array.<number>|Uint8Array)} */
  var length = new (USE_TYPEDARRAY ? Uint8Array : Array)(nSymbols);
  /** @type {Array} */
  var nodes;
  /** @type {!(Array.<number>|Uint8Array)} */
  var values;
  /** @type {!(Array.<number>|Uint8Array)} */
  var codeLength;
  /** @type {number} */
  var i;
  /** @type {number} */
  var il;
  /** @type {Array.<number>} */
  var freqsZero = [];

  // 配列の初期化
  if (!USE_TYPEDARRAY) {
    for (i = 0; i < nSymbols; i++) {
      length[i] = 0;
    }
  }

  // ヒープの構築
  for (i = 0; i < nSymbols; ++i) {
    if (freqs[i] > 0) {
      heap.push(i, freqs[i]);
    }
  }
  nodes = new Array(heap.length / 2);
  values = new (USE_TYPEDARRAY ? Uint32Array : Array)(heap.length / 2);

  // 非 0 の要素が一つだけだった場合は、そのシンボルに符号長 1 を割り当てて終了
  if (nodes.length === 1) {
    length[heap.pop().index] = 1;
    return length;
  }

  // Reverse Package Merge Algorithm による Canonical Huffman Code の符号長決定
  for (i = 0, il = heap.length / 2; i < il; ++i) {
    nodes[i] = heap.pop();
    values[i] = nodes[i].value;
  }
  codeLength = this.reversePackageMerge_(values, values.length, limit);

  for (i = 0, il = nodes.length; i < il; ++i) {
    length[nodes[i].index] = codeLength[i];
  }

  return length;
};

/**
 * Reverse Package Merge Algorithm.
 * @param {!(Array.<number>|Uint32Array)} freqs sorted probability.
 * @param {number} symbols number of symbols.
 * @param {number} limit code length limit.
 * @return {!(Array.<number>|Uint8Array)} code lengths.
 */
Zlib.RawDeflate.prototype.reversePackageMerge_ = function(freqs, symbols, limit) {
  /** @type {!(Array.<number>|Uint16Array)} */
  var minimumCost = new (USE_TYPEDARRAY ? Uint16Array : Array)(limit);
  /** @type {!(Array.<number>|Uint8Array)} */
  var flag = new (USE_TYPEDARRAY ? Uint8Array : Array)(limit);
  /** @type {!(Array.<number>|Uint8Array)} */
  var codeLength = new (USE_TYPEDARRAY ? Uint8Array : Array)(symbols);
  /** @type {Array} */
  var value = new Array(limit);
  /** @type {Array} */
  var type  = new Array(limit);
  /** @type {Array.<number>} */
  var currentPosition = new Array(limit);
  /** @type {number} */
  var excess = (1 << limit) - symbols;
  /** @type {number} */
  var half = (1 << (limit - 1));
  /** @type {number} */
  var i;
  /** @type {number} */
  var j;
  /** @type {number} */
  var t;
  /** @type {number} */
  var weight;
  /** @type {number} */
  var next;

  /**
   * @param {number} j
   */
  function takePackage(j) {
    /** @type {number} */
    var x = type[j][currentPosition[j]];

    if (x === symbols) {
      takePackage(j+1);
      takePackage(j+1);
    } else {
      --codeLength[x];
    }

    ++currentPosition[j];
  }

  minimumCost[limit-1] = symbols;

  for (j = 0; j < limit; ++j) {
    if (excess < half) {
      flag[j] = 0;
    } else {
      flag[j] = 1;
      excess -= half;
    }
    excess <<= 1;
    minimumCost[limit-2-j] = (minimumCost[limit-1-j] / 2 | 0) + symbols;
  }
  minimumCost[0] = flag[0];

  value[0] = new Array(minimumCost[0]);
  type[0]  = new Array(minimumCost[0]);
  for (j = 1; j < limit; ++j) {
    if (minimumCost[j] > 2 * minimumCost[j-1] + flag[j]) {
      minimumCost[j] = 2 * minimumCost[j-1] + flag[j];
    }
    value[j] = new Array(minimumCost[j]);
    type[j]  = new Array(minimumCost[j]);
  }

  for (i = 0; i < symbols; ++i) {
    codeLength[i] = limit;
  }

  for (t = 0; t < minimumCost[limit-1]; ++t) {
    value[limit-1][t] = freqs[t];
    type[limit-1][t]  = t;
  }

  for (i = 0; i < limit; ++i) {
    currentPosition[i] = 0;
  }
  if (flag[limit-1] === 1) {
    --codeLength[0];
    ++currentPosition[limit-1];
  }

  for (j = limit-2; j >= 0; --j) {
    i = 0;
    weight = 0;
    next = currentPosition[j+1];

    for (t = 0; t < minimumCost[j]; t++) {
      weight = value[j+1][next] + value[j+1][next+1];

      if (weight > freqs[i]) {
        value[j][t] = weight;
        type[j][t] = symbols;
        next += 2;
      } else {
        value[j][t] = freqs[i];
        type[j][t] = i;
        ++i;
      }
    }

    currentPosition[j] = 0;
    if (flag[j] === 1) {
      takePackage(j);
    }
  }

  return codeLength;
};

/**
 * 符号長配列からハフマン符号を取得する
 * reference: PuTTY Deflate implementation
 * @param {!(Array.<number>|Uint8Array)} lengths 符号長配列.
 * @return {!(Array.<number>|Uint16Array)} ハフマン符号配列.
 * @private
 */
Zlib.RawDeflate.prototype.getCodesFromLengths_ = function(lengths) {
  var codes = new (USE_TYPEDARRAY ? Uint16Array : Array)(lengths.length),
      count = [],
      startCode = [],
      code = 0, i, il, j, m;

  // Count the codes of each length.
  for (i = 0, il = lengths.length; i < il; i++) {
    count[lengths[i]] = (count[lengths[i]] | 0) + 1;
  }

  // Determine the starting code for each length block.
  for (i = 1, il = Zlib.RawDeflate.MaxCodeLength; i <= il; i++) {
    startCode[i] = code;
    code += count[i] | 0;
    code <<= 1;
  }

  // Determine the code for each symbol. Mirrored, of course.
  for (i = 0, il = lengths.length; i < il; i++) {
    code = startCode[lengths[i]];
    startCode[lengths[i]] += 1;
    codes[i] = 0;

    for (j = 0, m = lengths[i]; j < m; j++) {
      codes[i] = (codes[i] << 1) | (code & 1);
      code >>>= 1;
    }
  }

  return codes;
};

///////////////////////////////////////////////////////////////
// deflate.js

/**
 * Zlib Deflate
 * @constructor
 * @param {!(Array|Uint8Array)} input 符号化する対象の byte array.
 * @param {Object=} opt_params option parameters.
 */
Zlib.Deflate = function(input, opt_params) {
  /** @type {!(Array|Uint8Array)} */
  this.input = input;
  /** @type {!(Array|Uint8Array)} */
  this.output =
    new (USE_TYPEDARRAY ? Uint8Array : Array)(Zlib.Deflate.DefaultBufferSize);
  /** @type {Zlib.Deflate.CompressionType} */
  this.compressionType = Zlib.Deflate.CompressionType.DYNAMIC;
  /** @type {Zlib.RawDeflate} */
  this.rawDeflate;
  /** @type {Object} */
  var rawDeflateOption = {};
  /** @type {string} */
  var prop;

  // option parameters
  if (opt_params || !(opt_params = {})) {
    if (typeof opt_params['compressionType'] === 'number') {
      this.compressionType = opt_params['compressionType'];
    }
  }

  // copy options
  for (prop in opt_params) {
    rawDeflateOption[prop] = opt_params[prop];
  }

  // set raw-deflate output buffer
  rawDeflateOption['outputBuffer'] = this.output;

  this.rawDeflate = new Zlib.RawDeflate(this.input, rawDeflateOption);
};

/**
 * @const
 * @type {number} デフォルトバッファサイズ.
 */
Zlib.Deflate.DefaultBufferSize = 0x8000;

/**
 * @enum {number}
 */
Zlib.Deflate.CompressionType = Zlib.RawDeflate.CompressionType;

/**
 * 直接圧縮に掛ける.
 * @param {!(Array|Uint8Array)} input target buffer.
 * @param {Object=} opt_params option parameters.
 * @return {!(Array|Uint8Array)} compressed data byte array.
 */
Zlib.Deflate.compress = function(input, opt_params) {
  return (new Zlib.Deflate(input, opt_params)).compress();
};

/**
 * Deflate Compression.
 * @return {!(Array|Uint8Array)} compressed data byte array.
 */
Zlib.Deflate.prototype.compress = function() {
  /** @type {Zlib.CompressionMethod} */
  var cm;
  /** @type {number} */
  var cinfo;
  /** @type {number} */
  var cmf;
  /** @type {number} */
  var flg;
  /** @type {number} */
  var fcheck;
  /** @type {number} */
  var fdict;
  /** @type {number} */
  var flevel;
  /** @type {number} */
  var clevel;
  /** @type {number} */
  var adler;
  /** @type {boolean} */
  var error = false;
  /** @type {!(Array|Uint8Array)} */
  var output;
  /** @type {number} */
  var pos = 0;

  output = this.output;

  // Compression Method and Flags
  cm = Zlib.CompressionMethod.DEFLATE;
  switch (cm) {
    case Zlib.CompressionMethod.DEFLATE:
      cinfo = Math.LOG2E * Math.log(Zlib.RawDeflate.WindowSize) - 8;
      break;
    default:
      throw new Error('invalid compression method');
  }
  cmf = (cinfo << 4) | cm;
  output[pos++] = cmf;

  // Flags
  fdict = 0;
  switch (cm) {
    case Zlib.CompressionMethod.DEFLATE:
      switch (this.compressionType) {
        case Zlib.Deflate.CompressionType.NONE: flevel = 0; break;
        case Zlib.Deflate.CompressionType.FIXED: flevel = 1; break;
        case Zlib.Deflate.CompressionType.DYNAMIC: flevel = 2; break;
        default: throw new Error('unsupported compression type');
      }
      break;
    default:
      throw new Error('invalid compression method');
  }
  flg = (flevel << 6) | (fdict << 5);
  fcheck = 31 - (cmf * 256 + flg) % 31;
  flg |= fcheck;
  output[pos++] = flg;

  // Adler-32 checksum
  adler = Zlib.Adler32(this.input);

  this.rawDeflate.op = pos;
  output = this.rawDeflate.compress();
  pos = output.length;

  if (USE_TYPEDARRAY) {
    // subarray 分を元にもどす
    output = new Uint8Array(output.buffer);
    // expand buffer
    if (output.length <= pos + 4) {
      this.output = new Uint8Array(output.length + 4);
      this.output.set(output);
      output = this.output;
    }
    output = output.subarray(0, pos + 4);
  }

  // adler32
  output[pos++] = (adler >> 24) & 0xff;
  output[pos++] = (adler >> 16) & 0xff;
  output[pos++] = (adler >>  8) & 0xff;
  output[pos++] = (adler      ) & 0xff;

  return output;
};

////////////////////////////////////////////////////////////////////////////////

var Deflate = function(data) {
  return new Zlib.Deflate(data).compress();
};


module.exports = Deflate;
