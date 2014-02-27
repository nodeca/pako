'use strict'

var deflate = require('./deflate');

exports.run = function(data) {
  // Compression levels not supported. Use unknown defaults always
  return deflate(data.typed);
}
