'use strict'

var inflateSync = require('zlibjs').inflateSync;

exports.run = function(data, level) {
  // Compression levels not supported. Use unknown defaults always
  return inflateSync(data.deflateTyped);
}
