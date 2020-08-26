var CHUNKED_RE = /^\s*chunked\s*$/i;

function isEmptyObject(a) {
  if (a) {
    for (var i in a) { // eslint-disable-line
      return false;
    }
  }
  return true;
}

exports.isEmptyObject = isEmptyObject;

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

exports.addTrailerNames = function(headers, newTrailers, rawNames, delTrailers) {
  if (isEmptyObject(newTrailers) || (headers['content-length'] != null && !CHUNKED_RE.test(headers['transfer-encoding']))) {
    return;
  }
  var nameMap = {};
  var curTrailers = headers.trailer;
  if (curTrailers) {
    if (typeof curTrailers === 'string') {
      nameMap[curTrailers.toLowerCase()] = curTrailers;
    } else if (Array.isArray(curTrailers)) {
      curTrailers.forEach(function(key) {
        if (key && typeof key === 'string') {
          nameMap[key.toLowerCase()] = key;
        }
      });
    }
  }
  Object.keys(newTrailers).forEach(function(key) {
    var lkey = key.toLowerCase();
    if (!delTrailers || !delTrailers[lkey]) {
      nameMap[lkey] = key;
    }
  });
  if (rawNames) {
    rawNames.trailer = 'Trailer';
  }
  headers.trailer = Object.keys(nameMap).map(function(key) {
    return nameMap[key];
  });
};
