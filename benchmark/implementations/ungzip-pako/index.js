'use strict';

var pako = require('../../../');

exports.run = function (data) {
  return pako.ungzip(data.gzipTyped, {
  });
};
