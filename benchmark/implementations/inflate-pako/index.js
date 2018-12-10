'use strict'

var pako = require('../../../dist/pako.cjs');

exports.run = function(data) {
  return pako.inflate(data.deflateTyped, {
  });
}
