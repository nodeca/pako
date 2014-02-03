'use strict';


exports.arraySet =  function(dest, src, src_offs, len, dest_offs) {
  for(var i=0; i<len; i++) {
    dest[dest_offs + i] = src[src_offs + i];
  }
}

exports.arrayCreate =  function(length) {
  return new Array(length);
}
