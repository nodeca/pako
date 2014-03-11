'use strict'

var pako = require('../../../');
var utils = require('../../../lib/zlib/utils');

exports.run = function(data, level) {
  utils.forceUntyped = true;
  pako.inflate(data.deflateTyped, {
  });
  utils.forceUntyped = false;
}
