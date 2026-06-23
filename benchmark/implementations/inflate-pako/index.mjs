import pako from '../../../index.mjs';

export const run = (data) => {
  return pako.inflate(data.deflateTyped, {});
};
