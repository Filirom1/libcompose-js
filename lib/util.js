var transform = require('hoek').transform;
var swapKeyVal = require('object-swap-key-val');

exports.transform = function(object, mapping){
  mapping = swapKeyVal(mapping);
  return transform(object, mapping)
};
