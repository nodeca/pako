/** @category constants */
type Z_FlushMode =
  | typeof Z_NO_FLUSH
  | typeof Z_PARTIAL_FLUSH
  | typeof Z_SYNC_FLUSH
  | typeof Z_FULL_FLUSH
  | typeof Z_FINISH
  | typeof Z_BLOCK
  | typeof Z_TREES;

/** @category constants */
type Z_CallStatus =
  | typeof Z_OK
  | typeof Z_STREAM_END
  | typeof Z_NEED_DICT
  | typeof Z_ERRNO
  | typeof Z_STREAM_ERROR
  | typeof Z_DATA_ERROR
  | typeof Z_MEM_ERROR
  | typeof Z_BUF_ERROR;

/** @category zlib */
declare class ZStream {
  input: Uint8Array;
  next_in: number;
  avail_in: number;
  total_in: number;
  output: Uint8Array;
  next_out: number;
  avail_out: number;
  total_out: number;
  msg: string;
  state: any;
  data_type: number;
  adler: number;
}

/** @category zlib */
declare class GZheader {
  text: number;
  time: number;
  xflags: number;
  os: number;
  extra: Uint8Array | number[] | null;
  extra_len: number;
  name: string | null;
  comment: string | null;
  hcrc: boolean;
  done: boolean;
}

/** @category zlib */
declare function zlibDeflateInit(strm: ZStream, level: number): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateInit2(
  strm: ZStream,
  level: number,
  method: number,
  windowBits: number,
  memLevel: number,
  strategy: number,
  legacyHash?: boolean
): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateReset(strm: ZStream): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateResetKeep(strm: ZStream): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateSetHeader(strm: ZStream, head: GZheader): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateSetDictionary(strm: ZStream, dictionary: Uint8Array): Z_CallStatus;
/** @category zlib */
declare function zlibDeflate(strm: ZStream, flush: Z_FlushMode): Z_CallStatus;
/** @category zlib */
declare function zlibDeflateEnd(strm: ZStream): Z_CallStatus;

/** @category zlib */
declare function zlibInflateReset(strm: ZStream): Z_CallStatus;
/** @category zlib */
declare function zlibInflateReset2(strm: ZStream, windowBits: number): Z_CallStatus;
/** @category zlib */
declare function zlibInflateResetKeep(strm: ZStream): Z_CallStatus;
/** @category zlib */
declare function zlibInflateInit(strm: ZStream): Z_CallStatus;
/** @category zlib */
declare function zlibInflateInit2(strm: ZStream, windowBits: number): Z_CallStatus;
/** @category zlib */
declare function zlibInflateGetHeader(strm: ZStream, head: GZheader): Z_CallStatus;
/** @category zlib */
declare function zlibInflateSetDictionary(strm: ZStream, dictionary: Uint8Array): Z_CallStatus;
/** @category zlib */
declare function zlibInflate(strm: ZStream, flush: Z_FlushMode): Z_CallStatus;
/** @category zlib */
declare function zlibInflateEnd(strm: ZStream): Z_CallStatus;

declare const messages: Record<number, string>;

/** @category constants */
declare const Z_NO_FLUSH: 0;
/** @category constants */
declare const Z_PARTIAL_FLUSH: 1;
/** @category constants */
declare const Z_SYNC_FLUSH: 2;
/** @category constants */
declare const Z_FULL_FLUSH: 3;
/** @category constants */
declare const Z_FINISH: 4;
/** @category constants */
declare const Z_BLOCK: 5;
/** @category constants */
declare const Z_TREES: 6;

/** @category constants */
declare const Z_OK: 0;
/** @category constants */
declare const Z_STREAM_END: 1;
/** @category constants */
declare const Z_NEED_DICT: 2;
/** @category constants */
declare const Z_ERRNO: -1;
/** @category constants */
declare const Z_STREAM_ERROR: -2;
/** @category constants */
declare const Z_DATA_ERROR: -3;
/** @category constants */
declare const Z_MEM_ERROR: -4;
/** @category constants */
declare const Z_BUF_ERROR: -5;

export {
  GZheader,
  messages,
  Z_CallStatus,
  Z_FlushMode,
  ZStream,

  zlibDeflate,
  zlibDeflateEnd,
  zlibDeflateInit,
  zlibDeflateInit2,
  zlibDeflateReset,
  zlibDeflateResetKeep,
  zlibDeflateSetDictionary,
  zlibDeflateSetHeader,

  zlibInflate,
  zlibInflateEnd,
  zlibInflateGetHeader,
  zlibInflateInit,
  zlibInflateInit2,
  zlibInflateReset,
  zlibInflateReset2,
  zlibInflateResetKeep,
  zlibInflateSetDictionary,

  Z_BLOCK,
  Z_BUF_ERROR,
  Z_DATA_ERROR,
  Z_ERRNO,
  Z_FINISH,
  Z_FULL_FLUSH,
  Z_MEM_ERROR,
  Z_NEED_DICT,
  Z_NO_FLUSH,

  Z_OK,
  Z_PARTIAL_FLUSH,
  Z_STREAM_END,
  Z_STREAM_ERROR,
  Z_SYNC_FLUSH,
  Z_TREES
};
