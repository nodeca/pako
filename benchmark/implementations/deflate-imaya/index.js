'use strict';

const deflateSync = require('zlibjs').deflateSync;

exports.run = (data, level) => {
  // Compression levels not supported. Use unknown defaults always
  return deflateSync(data.typed, { level: level });
};
