export {
  deflateInit as zlibDeflateInit,
  deflateInit2 as zlibDeflateInit2,
  deflateReset as zlibDeflateReset,
  deflateResetKeep as zlibDeflateResetKeep,
  deflateSetHeader as zlibDeflateSetHeader,
  deflateSetDictionary as zlibDeflateSetDictionary,
  deflate as zlibDeflate,
  deflateEnd as zlibDeflateEnd,
  deflateInfo as zlibDeflateInfo
} from './zlib/deflate.mjs';

export {
  inflateReset as zlibInflateReset,
  inflateReset2 as zlibInflateReset2,
  inflateResetKeep as zlibInflateResetKeep,
  inflateInit as zlibInflateInit,
  inflateInit2 as zlibInflateInit2,
  inflateGetHeader as zlibInflateGetHeader,
  inflateSetDictionary as zlibInflateSetDictionary,
  inflate as zlibInflate,
  inflateEnd as zlibInflateEnd,
  inflateInfo as zlibInflateInfo
} from './zlib/inflate.mjs';

export { default as ZStream } from './zlib/zstream.mjs';
export { default as GZheader } from './zlib/gzheader.mjs';
export { default as messages } from './zlib/messages.mjs';

export {
  Z_NO_FLUSH,
  Z_PARTIAL_FLUSH,
  Z_SYNC_FLUSH,
  Z_FULL_FLUSH,
  Z_FINISH,
  Z_BLOCK,
  Z_TREES,

  Z_OK,
  Z_STREAM_END,
  Z_NEED_DICT,
  Z_ERRNO,
  Z_STREAM_ERROR,
  Z_DATA_ERROR,
  Z_MEM_ERROR,
  Z_BUF_ERROR
} from './zlib/constants.mjs';
