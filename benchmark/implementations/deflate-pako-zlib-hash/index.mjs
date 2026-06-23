import pako from '../../../src/index.mjs';

// Pako with default zlib hash (slower).
export const run = (data, level) => {
  return pako.deflate(data.typed, { level: level });
};
