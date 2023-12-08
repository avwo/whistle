var formatHost = require('./common').formatHost;
var parseUrl = require('./parse-url-safe');

var URL_RE = /^([a-z0-9.+-]+:)\/\/([^/?#]*)(\/[^?#]*)?(\?[^#]*)?(#[\s\S]*)?$/i;
var HOST_RE = /^(.+)(?::(\d*))$/;

module.exports = function (url) {
  if (!URL_RE.test(url)) {
    return parseUrl(url);
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
    hostname: formatHost(hostname),
    hash: hash,
    search: search || null,
    query: search ? search.substring(1) : null,
    pathname: pathname,
    path: pathname + search,
    href: url
  };
};
