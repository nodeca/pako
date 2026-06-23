import pako from '../../../src/index.mjs';

export const run = (data, level) => {
  return pako.gzip(data.typed, { level: level });
};
