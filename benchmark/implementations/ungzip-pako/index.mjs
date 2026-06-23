import pako from '../../../src/index.mjs';

export const run = (data) => {
  return pako.ungzip(data.gzipTyped, {
  });
};
