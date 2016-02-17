'use strict'

var pako = require('../../../');

exports.run = function(data, level) {
  return pako.deflate(data.typed, {
    level: level
  });
}
