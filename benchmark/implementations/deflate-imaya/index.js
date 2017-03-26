'use strict'

var deflateSync = require('zlibjs').deflateSync;

exports.run = function(data, level) {
  // Compression levels not supported. Use unknown defaults always
  return deflateSync(data.typed, { level: level });
}
