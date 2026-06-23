import pako from '../../../src/index.mjs';

// Pako with the fast ANZAC++ hash, instead of the default classic zlib hash.
export const run = (data, level) => {
  return pako.deflate(data.typed, { level: level, legacyHash: false });
};
