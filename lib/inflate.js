'use strict';

//var z_inflate = require('./zlib/inflate');
var utils = require('./zlib/utils');


var Inflate = function(/*options*/) {

};


Inflate.prototype.push = function(/*data_in*/) {

};

Inflate.prototype.finish = function() {

};

Inflate.prototype.onData = function(/*data_out*/) {

};

Inflate.prototype.onEnd = function(/*error*/) {

};

function inflate (input, options) {
  var result;
  var chains = [];
  var inflator = new Inflate(options);

  inflator.onData = function(data_out) {
    chains.push(data_out);
  };

  inflator.onEnd = function(error) {
    var i, l, len, pos, chain;

    if (error) { throw error; }

    // calculate data length
    len = 0;
    for (i=0, l=chains.length; i<l; i++) {
      len += chains[i].length;
    }

    // join chains
    result = utils.arrayCreate(len);
    pos = 0;

    for (i=0, l=chains.length; i<l; i++) {
      chain = chains[i];
      len = chain.length;
      utils.arraySet(result, chain, 0, len, pos);
      pos += len;
    }
  };

  inflator.push(input);

  return result;
}

function inflateRaw (input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}

exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;