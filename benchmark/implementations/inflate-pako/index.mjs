import pako from '../../../src/index.mjs';

export const run = (data) => {
  return pako.inflate(data.deflateTyped, {});
};
