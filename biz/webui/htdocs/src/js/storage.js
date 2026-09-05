var PREFIX = location.href
  .replace(/[?#].*$/, '')
  .replace(/\/index.html$/i, '/');
var cache = {};
var stroage = window.localStorage;

function getKey(key) {
  return PREFIX + '?' + key;
}

exports.set = function (key, value) {
  key = getKey(key);
  if (value == null) {
    value = '';
  } else {
    value += '';
  }
  cache[key] = value;
  try {
    stroage[key] = value;
  } catch (e) {}
};

exports.get = function (key, noCache) {
  key = getKey(key);
  try {
    return noCache ? stroage[key] : cache[key] || stroage[key];
  } catch (e) {}
  return cache[key];
};

exports.remove = function(key) {
  try {
    stroage.removeItem(getKey(key));
  } catch (e) {}
};
