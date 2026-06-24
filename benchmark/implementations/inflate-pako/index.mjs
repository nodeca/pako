import { inflate } from '../../../src/index.ts';

export const run = (data) => {
  return inflate(data.deflateTyped, {});
};
