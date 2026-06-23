import zlib from 'node:zlib';

export const run = (data, level) => {
  zlib.deflateSync(data.buffer, { level:level });
};
