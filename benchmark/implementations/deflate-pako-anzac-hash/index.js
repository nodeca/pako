'use strict';

const pako = require('../../../');

// Pako with the fast ANZAC++ hash, instead of the default classic zlib hash.
exports.run = (data, level) => {
  return pako.deflate(data.typed, { level: level, legacyHash: false });
};
