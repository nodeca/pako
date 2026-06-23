import pako from '../../../index.mjs';

export const run = (data, level) => {
  return pako.gzip(data.typed, { level: level });
};
