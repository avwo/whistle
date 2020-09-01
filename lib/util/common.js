var HEAD_RE = /^head$/i;
var ILLEGAL_TRALIERS = ['host', 'transfer-encoding', 'content-length', 'cache-control', 'te', 'max-forwards', 'authorization', 'set-cookie', 'content-encoding', 'content-type', 'content-range', 'trailer', 'connection', 'upgrade', 'http2-settings', 'proxy-connection', 'transfer-encoding', 'keep-alive'];

function isHead(req) {
  return HEAD_RE.test(req.method);
}

exports.isHead = isHead;

function hasBody(res, req) {
  if (req && isHead(req)) {
    return false;
  }
  var statusCode = res.statusCode;
  return !(statusCode == 204 || (statusCode >= 300 && statusCode < 400) ||
    (100 <= statusCode && statusCode <= 199));
}

exports.hasBody = hasBody;

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

exports.removeIllegalTrailers = function(headers) {
  ILLEGAL_TRALIERS.forEach(function(key) {
    delete headers[key];
  });
};

exports.addTrailerNames = function(res, newTrailers, rawNames, delTrailers, req) {
  if (!hasBody(res, req) || isEmptyObject(newTrailers)) {
    return;
  }
  var headers = res.headers;
  delete headers['content-length'];
  delete headers['transfer-encoding'];
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
    if ((!delTrailers || !delTrailers[lkey]) && ILLEGAL_TRALIERS.indexOf(lkey) === -1) {
      nameMap[lkey] = key;
    }
  });
  if (rawNames && !rawNames.trailer) {
    rawNames.trailer = 'Trailer';
  }
  headers.trailer = Object.keys(nameMap).map(function(key) {
    return nameMap[key];
  });
};

exports.onResEnd = function(res, callback) {
  const state = res._readableState || '';
  if (state.endEmitted) {
    return callback();
  }
  res.on('end', callback);
};
