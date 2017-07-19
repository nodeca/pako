'use strict'

var zlib = require('zlib');

exports.run = function(data) {
  zlib.inflateSync(data.deflateBuffer);
}
