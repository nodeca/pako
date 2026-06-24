import {
  Deflate,
  GZheader,
  Inflate,
  zlibDeflateSetDictionary,
  zlibDeflateSetHeader,
  zlibInflateSetDictionary,
  Z_OK
} from '../src/index.ts';

const data = new Uint8Array([ 1, 2, 3, 1, 2, 3 ]);
const dict = new Uint8Array([ 1, 2, 3 ]);

// Deflate needs the dictionary before the first byte is compressed.
const deflator = new Deflate();
deflator.onStart = function (strm) {
  if (zlibDeflateSetDictionary(strm, dict) !== Z_OK) throw new Error('dictionary rejected');
};
deflator.push(data, true);

// Zlib-wrapped inflate asks for the dictionary after reading its dictionary id.
const inflator = new Inflate();
inflator.onNeedDict = function () { return dict; };
inflator.push(deflator.result, true);

// Raw deflate has no wrapper header, so both sides set the dictionary up front.
const rawDeflator = new Deflate({ raw: true });
rawDeflator.onStart = function (strm) {
  if (zlibDeflateSetDictionary(strm, dict) !== Z_OK) throw new Error('dictionary rejected');
};
rawDeflator.push(data, true);

const rawInflator = new Inflate({ raw: true });
rawInflator.onStart = function (strm) {
  if (zlibInflateSetDictionary(strm, dict) !== Z_OK) throw new Error('dictionary rejected');
};
rawInflator.push(rawDeflator.result, true);

// Gzip header is written before compression starts.
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
