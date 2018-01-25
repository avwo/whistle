var parse = require('url').parse;

var URL_RE = /^([a-z0-9.+-]+:)\/\/([^/?#]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i;
var HOST_RE = /^(.+)(?::(\d*))$/;
var BRACKET_RE = /^\[|\]$/g;

module.exports = function(url) {
  if (!URL_RE.test(url)) {
    return parse(url);
  }
  var protocol = RegExp.$1;
  var host = RegExp.$2;
  var pathname = RegExp.$3 || '/';
  var search = RegExp.$4;
  var hash = RegExp.$5 || null;
  var port = null;
  var hostname = host;
  if (HOST_RE.test(host)) {
    hostname = RegExp.$1;
    port = RegExp.$2;
  }

  return {
    protocol: protocol,
    slashes: true,
    auth: null,
    host: host,
    port: port,
    hostname: hostname.replace(BRACKET_RE, ''),
    hash: hash,
    search: search || null,
    query: search ? search.substring(1) : null,
    pathname: pathname,
    path: pathname + search,
    href: url
  };
};
