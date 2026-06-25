type Z_FlushMode =
  | typeof Z_NO_FLUSH
  | typeof Z_PARTIAL_FLUSH
  | typeof Z_SYNC_FLUSH
  | typeof Z_FULL_FLUSH
  | typeof Z_FINISH
  | typeof Z_BLOCK
  | typeof Z_TREES;

type Z_CallStatus =
  | typeof Z_OK
  | typeof Z_STREAM_END
  | typeof Z_NEED_DICT
  | typeof Z_ERRNO
  | typeof Z_STREAM_ERROR
  | typeof Z_DATA_ERROR
  | typeof Z_MEM_ERROR
  | typeof Z_BUF_ERROR;

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

declare const zlibDeflateInit: (strm: ZStream, level: number) => Z_CallStatus;
declare const zlibDeflateInit2: (
  strm: ZStream,
  level: number,
  method: number,
  windowBits: number,
  memLevel: number,
  strategy: number,
  legacyHash?: boolean
) => Z_CallStatus;
declare const zlibDeflateReset: (strm: ZStream) => Z_CallStatus;
declare const zlibDeflateResetKeep: (strm: ZStream) => Z_CallStatus;
declare const zlibDeflateSetHeader: (strm: ZStream, head: GZheader) => Z_CallStatus;
declare const zlibDeflateSetDictionary: (strm: ZStream, dictionary: Uint8Array) => Z_CallStatus;
declare const zlibDeflate: (strm: ZStream, flush: Z_FlushMode) => Z_CallStatus;
declare const zlibDeflateEnd: (strm: ZStream) => Z_CallStatus;
declare const zlibDeflateInfo: string;

declare const zlibInflateReset: (strm: ZStream) => Z_CallStatus;
declare const zlibInflateReset2: (strm: ZStream, windowBits: number) => Z_CallStatus;
declare const zlibInflateResetKeep: (strm: ZStream) => Z_CallStatus;
declare const zlibInflateInit: (strm: ZStream) => Z_CallStatus;
declare const zlibInflateInit2: (strm: ZStream, windowBits: number) => Z_CallStatus;
declare const zlibInflateGetHeader: (strm: ZStream, head: GZheader) => Z_CallStatus;
declare const zlibInflateSetDictionary: (strm: ZStream, dictionary: Uint8Array) => Z_CallStatus;
declare const zlibInflate: (strm: ZStream, flush: Z_FlushMode) => Z_CallStatus;
declare const zlibInflateEnd: (strm: ZStream) => Z_CallStatus;
declare const zlibInflateInfo: string;

declare const messages: Record<number, string>;

declare const Z_NO_FLUSH: 0;
declare const Z_PARTIAL_FLUSH: 1;
declare const Z_SYNC_FLUSH: 2;
declare const Z_FULL_FLUSH: 3;
declare const Z_FINISH: 4;
declare const Z_BLOCK: 5;
declare const Z_TREES: 6;

declare const Z_OK: 0;
declare const Z_STREAM_END: 1;
declare const Z_NEED_DICT: 2;
declare const Z_ERRNO: -1;
declare const Z_STREAM_ERROR: -2;
declare const Z_DATA_ERROR: -3;
declare const Z_MEM_ERROR: -4;
declare const Z_BUF_ERROR: -5;

export {
  GZheader,
  messages,
  Z_CallStatus,
  Z_FlushMode,
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
