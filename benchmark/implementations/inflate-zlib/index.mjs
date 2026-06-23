import zlib from 'node:zlib';

export const run = (data) => {
  zlib.inflateSync(data.deflateTyped);
};
