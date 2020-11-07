'use strict';

var pako = require('../../../');

exports.run = function (data, level) {
  pako.deflate(data.string, {
    level: level,
    to: 'string'
  });
};
