// Top level file is just a mixin of submodules & constants

export { Deflate, deflate, deflateRaw, gzip } from './deflate.ts';

export { Inflate, inflate, inflateRaw, ungzip } from './inflate.ts';

export {
  zlibDeflateInit,
  zlibDeflateInit2,
  zlibDeflateReset,
  zlibDeflateResetKeep,
  zlibDeflateSetHeader,
  zlibDeflateSetDictionary,
  zlibDeflate,
  zlibDeflateEnd,
  zlibDeflateInfo,

  zlibInflateReset,
  zlibInflateReset2,
  zlibInflateResetKeep,
  zlibInflateInit,
  zlibInflateInit2,
  zlibInflateGetHeader,
  zlibInflateSetDictionary,
  zlibInflate,
  zlibInflateEnd,
  zlibInflateInfo,

  ZStream,
  GZheader,

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
} from './zlib.ts';
