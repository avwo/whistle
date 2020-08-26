exports.isEmptyObject = function(a) {
  if (a) {
    for (var i in a) { // eslint-disable-line
      return false;
    }
  }
  return true;
};

exports.lowerCaseify = function(obj, rawNames) {
  var result = {};
  if (!obj) {
    return result;
  }
  Object.keys(obj).forEach(function(name) {
    var value = obj[name];
    if (value !== undefined) {
      var key  = name.toLowerCase();
      result[key] = Array.isArray(value) ? value : value + '';
      if (rawNames) {
        rawNames[key] = name;
      }
    }
  });
  return result;
};
