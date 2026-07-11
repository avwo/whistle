var parseUrl = require('./parse-url-safe');

var formatHost = parseUrl.formatHost;
var URL_RE = /^([a-z0-9.+-]+:)\/\/([^/?#]*)(\/[^?#]*)?(\?[^#]*)?(#[\s\S]*)?$/i;
var HOST_RE = /^(.+)(?::(\d*))$/;

module.exports = function (url) {
  var urlMatch = URL_RE.exec(url);
  if (!urlMatch) {
    return parseUrl(url);
  }
  var protocol = urlMatch[1];
  var host = urlMatch[2];
  var pathname = urlMatch[3] || '/';
  var search = urlMatch[4] || '';
  var hash = urlMatch[5] || null;
  var port = null;
  var hostname = host;
  var hostMatch = HOST_RE.exec(host);
  if (hostMatch) {
    hostname = hostMatch[1];
    port = hostMatch[2];
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

module.exports.formatHost = formatHost;
