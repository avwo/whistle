var LRU = require('lru-cache');

var cache = new LRU({ max: 100, maxAge: 1000 * 60 });
var MAX_SIZE = 1024 * 1280;

function getData(reqId) {
  return cache.get(reqId);
}

exports = module.exports = function(req, res) {
  var ids = req.query.ids;
  var result = {};
  ids = ids && typeof ids === 'string' ? ids.split(',') : ids;
  if (!ids) {
    return res.json(result);
  }
  ids.forEach(function(reqId) {
    var curBuf = getData(reqId);
    if (curBuf) {
      if (curBuf._hasW2End) {
        cache.del(reqId);
      } else {
        cache.set(reqId, '');
      }
    }
    result[reqId] = curBuf ? curBuf.toString('base64') : curBuf;
  });
  res.json(result);
};

exports.setData = function(reqId, buffer, init) {
  var curBuf = cache.get(reqId);
  if (!init && curBuf == null) {
    return false;
  }
  if (curBuf) {
    if (buffer && curBuf.length < MAX_SIZE) {
      cache.set(reqId, Buffer.concat([curBuf, buffer]));
    }
  } else {
    cache.set(reqId, buffer || '');
  }
  return true;
};

exports.getData = getData;

exports.removeData = function(reqId) {
  cache.del(reqId);
};
