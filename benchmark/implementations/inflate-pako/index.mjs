import { inflate } from '../../../src/index.mjs';

export const run = (data) => {
  return inflate(data.deflateTyped, {});
};
