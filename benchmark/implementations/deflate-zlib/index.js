'use strict'

var zlib = require('zlib');

exports.run = function(data, level, callback) {
  zlib.deflateSync(data.buffer, {level:level});
}
