'use strict';

const pako = require('../../../');

// Pako with the classic zlib hash (legacyHash), instead of fast ANZAC++.
exports.run = (data, level) => {
  return pako.deflate(data.typed, { level: level, legacyHash: true });
};
