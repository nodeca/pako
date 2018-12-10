'use strict'

var pako = require('../../../dist/pako.cjs');

exports.run = function(data, level) {
  pako.deflate(data.string, {
    level: level,
    to: 'string'
  });
}
