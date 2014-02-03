'use strict'

var deflate = require('./deflate');

exports.run = function(data) {
  return deflate(data);
}
