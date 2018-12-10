'use strict'

var pako = require('../../../dist/pako.cjs');

exports.run = function(data, level) {
  return pako.deflate(data.typed, {
    level: level
  });
}
