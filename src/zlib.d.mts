type FlushMode =
  | typeof Z_NO_FLUSH
  | typeof Z_PARTIAL_FLUSH
  | typeof Z_SYNC_FLUSH
  | typeof Z_FULL_FLUSH
  | typeof Z_FINISH
  | typeof Z_BLOCK
  | typeof Z_TREES;

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

declare const zlibDeflateInit: (strm: ZStream, level: number) => number;
declare const zlibDeflateInit2: (
  strm: ZStream,
  level: number,
  method: number,
  windowBits: number,
  memLevel: number,
  strategy: number,
  legacyHash?: boolean
) => number;
declare const zlibDeflateReset: (strm: ZStream) => number;
declare const zlibDeflateResetKeep: (strm: ZStream) => number;
declare const zlibDeflateSetHeader: (strm: ZStream, head: GZheader) => number;
declare const zlibDeflateSetDictionary: (strm: ZStream, dictionary: Uint8Array) => number;
declare const zlibDeflate: (strm: ZStream, flush: FlushMode) => number;
declare const zlibDeflateEnd: (strm: ZStream) => number;
declare const zlibDeflateInfo: string;

declare const zlibInflateReset: (strm: ZStream) => number;
declare const zlibInflateReset2: (strm: ZStream, windowBits: number) => number;
declare const zlibInflateResetKeep: (strm: ZStream) => number;
declare const zlibInflateInit: (strm: ZStream) => number;
declare const zlibInflateInit2: (strm: ZStream, windowBits: number) => number;
declare const zlibInflateGetHeader: (strm: ZStream, head: GZheader) => number;
declare const zlibInflateSetDictionary: (strm: ZStream, dictionary: Uint8Array) => number;
declare const zlibInflate: (strm: ZStream, flush: FlushMode) => number;
declare const zlibInflateEnd: (strm: ZStream) => number;
declare const zlibInflateInfo: string;

declare const messages: Record<number, string>;

declare const Z_NO_FLUSH: 0;
declare const Z_PARTIAL_FLUSH: 1;
declare const Z_SYNC_FLUSH: 2;
declare const Z_FULL_FLUSH: 3;
declare const Z_FINISH: 4;
declare const Z_BLOCK: 5;
declare const Z_TREES: 6;

declare const Z_OK: number;
declare const Z_STREAM_END: number;
declare const Z_NEED_DICT: number;
declare const Z_ERRNO: number;
declare const Z_STREAM_ERROR: number;
declare const Z_DATA_ERROR: number;
declare const Z_MEM_ERROR: number;
declare const Z_BUF_ERROR: number;

export {
  GZheader,
  FlushMode,
  messages,
  ZStream,

  zlibDeflate,
  zlibDeflateEnd,
  zlibDeflateInfo,
  zlibDeflateInit,
  zlibDeflateInit2,
  zlibDeflateReset,
  zlibDeflateResetKeep,
  zlibDeflateSetDictionary,
  zlibDeflateSetHeader,

  zlibInflate,
  zlibInflateEnd,
  zlibInflateGetHeader,
  zlibInflateInfo,
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
