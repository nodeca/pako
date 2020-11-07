'use strict';

var zlib = require('zlib');

exports.run = function (data, level) {
  zlib.deflateSync(data.buffer, { level:level });
};
