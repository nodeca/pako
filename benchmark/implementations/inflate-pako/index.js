'use strict';

const pako = require('../../../');

exports.run = (data) => {
  return pako.inflate(data.deflateTyped, {});
};
