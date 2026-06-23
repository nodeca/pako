import { deflate } from '../../../src/index.mjs';

// Pako with default zlib hash (slower).
export const run = (data, level) => {
  return deflate(data.typed, { level: level });
};
