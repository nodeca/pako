import { gzip } from '../../../src/index.ts';

export const run = (data, level) => {
  return gzip(data.typed, { level: level });
};
