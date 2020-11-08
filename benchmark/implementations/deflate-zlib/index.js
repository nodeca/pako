'use strict';

const zlib = require('zlib');

exports.run = (data, level) => {
  zlib.deflateSync(data.buffer, { level:level });
};
