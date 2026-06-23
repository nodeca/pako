import { gzip } from '../../../src/index.mjs';

export const run = (data, level) => {
  return gzip(data.typed, { level: level });
};
