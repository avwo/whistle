var parse = require('url').parse;

var URL_RE = /^([a-z0-9.+-]+:)\/\/([^/?#]+)(?::(\d*))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;

module.exports = function(url) {
  if (!URL_RE.test(url)) {
    return parse(url);
  }
  var hostname = RegExp.$2;
  var port = RegExp.$3;
  var pathname = RegExp.$4 || '/';
  var search = RegExp.$5;
  var hash = RegExp.$6;

  return  {
    protocol: RegExp.$1,
    slashes: true,
    auth: null,
    host: hostname + (port ? ':' + port : ''),
    port: port || null,
    hostname: hostname,
    hash: hash || null,
    search: search || null,
    query: search ? search.substring(1) : null,
    pathname: pathname,
    path: pathname + search,
    href: url
  };
};
