// Top level file is just a mixin of submodules & constants

export { Deflate, deflate, deflateRaw, gzip } from './lib/deflate.mjs';

export { Inflate, inflate, inflateRaw, ungzip } from './lib/inflate.mjs';

export * as constants from './lib/zlib/constants.mjs';
