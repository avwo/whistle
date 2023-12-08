var parseUrl = require('url').parse;
var formatHost = require('./common').formatHost;

var CONTROL_RE = /^[\n\r\t\x00-\x20\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/;
var PROTOCOL_RE = /^([a-z][a-z0-9.+-]*:)?(\/\/)?([\\/]+)?([\S\s]*)/i;
var WIN_DRIVE_RE = /^[a-zA-Z]:/;
var PORT_RE = /:(\d*)$/;

function needPort(port, protocol) {
  protocol = protocol.split(':')[0];
  port = +port;

  if (!port) {
    return false;
  }

  switch (protocol) {
  case 'http':
  case 'ws':
    return port !== 80;

  case 'https':
  case 'wss':
    return port !== 443;

  case 'ftp':
    return port !== 21;

  case 'gopher':
    return port !== 70;

  case 'file':
    return false;
  }

  return port !== 0;
}

function getProtocol(addr) {
  var match = PROTOCOL_RE.exec(addr);
  var protocol = match[1] ? match[1].toLowerCase() : '';
  var forwardSlashes = match[2] || '';
  var otherSlashes = match[3] || '';
  var slashesCount = forwardSlashes.length + otherSlashes.length;
  var rest = forwardSlashes + otherSlashes + match[4];

  if (protocol === 'file:') {
    if (slashesCount >= 2) {
      rest = rest.slice(2);
    }
  } else if (protocol && forwardSlashes) {
    rest = rest.slice(2);
  }

  return {
    protocol: protocol,
    slashes: !!forwardSlashes,
    slashesCount: slashesCount,
    rest: rest
  };
}

function encode(str) {
  try {
    return encodeURIComponent(decodeURIComponent(str));
  } catch (e) {
    return '';
  }
}

function formatPath(url) {
  if (url.pathname.charAt(0) !== '/') {
    url.pathname = '/' + url.pathname;
  }
}

function formatPort(url) {
  if (!needPort(url.port, url.protocol)) {
    url.host = url.hostname;
    url.port = '';
  }
}

function parseAuth(url) {
  url.username = url.password = '';
  if (url.auth) {
    var index = url.auth.indexOf(':');
    if (index !== -1) {
      url.username = url.auth.slice(0, index);
      url.username = encode(url.username);
      url.password = url.auth.slice(index + 1);
      url.password = encode(url.password);
    } else {
      url.username = encode(url.auth);
    }
    url.auth = url.password ? url.username +':'+ url.password : url.username;
  }
}

function formatOrigin(url) {
  var protocol = url.protocol;
  if (protocol !== 'file:' && url.host) {
    url.origin = protocol +'//'+ url.host;
  } else {
    url.origin = 'null';
  }
}

function formatUrl(url) {
  var host = url.host;
  var protocol = url.protocol;
  var result = protocol + (protocol && url.slashes ? '//' : '');

  if (url.username) {
    result += url.username;
    if (url.password) {
      result += ':'+ url.password;
    }
    result += '@';
  } else if (url.password) {
    result += ':'+ url.password + '@';
  }

  result += host + url.pathname;

  if (url.search) {
    result += url.search;
  }

  if (url.hash) {
    result += url.hash;
  }
  url.href = result;
}

module.exports = function(addr) {
  try {
    return parseUrl(addr);
  } catch (e) {}

  addr = String(addr || '').replace(CONTROL_RE, '');

  var url = {};
  var result = getProtocol(addr);
  var protocol = result.protocol;

  url.slashes = result.slashes;
  url.protocol = protocol;
  addr = result.rest;

  var index = addr.indexOf('#');
  if (index !== -1) {
    url.hash = addr.substring(index);
    addr = addr.substring(0, index);
  }

  index = addr.indexOf('?');
  if (index !== -1) {
    url.search = addr.substring(index);
    url.query = addr.substring(index + 1);
    addr = addr.substring(0, index);
  }

  if (
    (protocol === 'file:' && (result.slashesCount !== 2 || WIN_DRIVE_RE.test(addr))) ||
    (!result.slashes && (protocol || result.slashesCount < 2))
  ) {
    url.pathname = addr;
    url.host = url.hostname = '';
  } else {
    index = addr.indexOf('/');
    if (index !== -1) {
      url.pathname = addr.substring(index);
      addr = addr.substring(0, index);
    } else {
      url.pathname = '/';
    }
    url.path = url.pathname + (url.search || '');
    index = addr.lastIndexOf('@');
    if (index !== -1) {
      url.auth = addr.substring(0, index);
      addr = addr.substring(index + 1);
    }

    url.host = addr;
    index = PORT_RE.exec(addr);
    if (index) {
      url.port = index[1];
      addr = addr.substring(0, index.index);
    }
    url.hostname = formatHost(addr);
  }

  formatPath(url);
  formatPort(url);
  parseAuth(url);
  formatOrigin(url);
  formatUrl(url);
  return url;
};
