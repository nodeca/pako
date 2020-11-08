'use strict';

const zlib = require('zlib');

exports.run = (data) => {
  zlib.inflateSync(data.deflateTyped);
};
