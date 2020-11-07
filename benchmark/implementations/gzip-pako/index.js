'use strict';

var pako = require('../../../');

exports.run = function (data, level) {
  return pako.gzip(data.typed, { level: level });
};
