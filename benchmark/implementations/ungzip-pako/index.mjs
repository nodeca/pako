import pako from '../../../index.mjs';

export const run = (data) => {
  return pako.ungzip(data.gzipTyped, {
  });
};
