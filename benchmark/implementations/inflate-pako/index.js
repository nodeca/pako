'use strict'

var pako = require('../../../');

exports.run = function(data) {
  return pako.inflate(data.deflateTyped, {
  });
}
