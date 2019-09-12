var qs = require('querystring');

var TOKEN_RE = /\r\u0000\n\u0003\r/g;
var PLUS_RE = /\+/g;
var TOKEN = '\r\u0000\n\u0003\r';

var decoder = {
  decodeURIComponent: function(s) {
    s = s.replace(TOKEN_RE, '+');
    return qs.unescape(s);
  }
};
var rawDecoder = {
  decodeURIComponent: function(s) {
    return s.replace(TOKEN_RE, '+');
  }
};
var rawDecoder2 = {
  decodeURIComponent: function(s) {
    return s;
  }
};


function parse(str, sep, eq, escape) {
  try {
    if (str.indexOf('+') === -1 || str.indexOf(TOKEN) !== -1) {
      return qs.parse(str, sep, eq, escape ? rawDecoder2 : undefined);
    }
    str = str.replace(PLUS_RE, TOKEN);
    return qs.parse(str, sep, eq, escape ? rawDecoder : decoder);
  } catch (e) {}
  return '';
}

module.exports = parse;
