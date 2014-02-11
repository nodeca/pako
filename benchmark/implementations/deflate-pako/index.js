'use strict'

var pako = require('../../../index.js');

exports.run = function(data) {
  return pako.deflate(data, {
    level: 0
  });
}
