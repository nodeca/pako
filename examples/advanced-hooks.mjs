import {
  Deflate,
  GZheader,
  zlibDeflateSetHeader,
  Z_OK
} from '../src/index.ts';

const data = new Uint8Array([ 1, 2, 3, 1, 2, 3 ]);

const gzipper = new Deflate({ gzip: true });
gzipper.onStart = function (strm) {
  const header = new GZheader();
  header.name = 'data.bin';
  header.hcrc = true;

  if (zlibDeflateSetHeader(strm, header) !== Z_OK) {
    throw new Error('header rejected');
  }
};
gzipper.push(data, true);
