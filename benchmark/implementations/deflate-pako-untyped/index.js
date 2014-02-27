'use strict'

var pako = require('../../../');
var utils = require('../../../lib/zlib/utils');

exports.run = function(data, level) {
  utils.forceUntyped = true;
  pako.deflate(data.typed, {
    level: level
  });
  utils.forceUntyped = false;
}
