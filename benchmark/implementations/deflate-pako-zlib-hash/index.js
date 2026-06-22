'use strict';

const pako = require('../../../');

// Pako with default zlib hash (slower).
exports.run = (data, level) => {
  return pako.deflate(data.typed, { level: level });
};
