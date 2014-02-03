'use strict'

var zlib = require('zlib');

exports.async = true;

exports.run = function(data, callback) {
  var buffer = new Buffer(data);
  zlib.deflate(buffer, callback);
}
