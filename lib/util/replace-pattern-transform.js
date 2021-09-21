var Transform = require('pipestream').Transform;
var util = require('util');

var LENGTH = 5120;
var slice = [].slice;
var SUB_MATCH_RE = /(^|\\{0,2})?(\$[&\d])/g;
var ALL_RE = /^\/\.[*+]\/g?i?g?$/;
var MAX_SUB_MATCH_LEN = 512;

function ReplacePatternTransform(pattern, value) {
  Transform.call(this);
  this._pattern = pattern;
  this._replaceAll = ALL_RE.test(pattern);
  this._value = value == null ? '' : value + '';
  this._rest = '';
}

util.inherits(ReplacePatternTransform, Transform);

var proto = ReplacePatternTransform.prototype;
proto._transform = function(chunk, _, callback) {
  var value = this._value;
  if (this._replaceAll) {
    this._value = '';
    chunk = value;
  } else if (chunk != null) {
    chunk = this._rest + chunk;
    var index = 0;
    var len = chunk.length - MAX_SUB_MATCH_LEN;
    var result = chunk.replace(this._pattern, function() {
      var matcher = arguments[0];
      var matcherLen = matcher.length;
      var i = arguments[arguments.length - 2] + matcherLen;
      var subLen = i - len;
      if (subLen >= 0 && matcherLen <= LENGTH - subLen) {
        return matcher;
      }
      index = i;
      return replacePattern(value, arguments);
    });
    index = Math.max(index, chunk.length - LENGTH);
    this._rest = chunk.substring(index);
    chunk = result.substring(0, result.length - this._rest.length);
  } else if (this._rest) {
    chunk = this._rest.replace(this._pattern, function() {
      return replacePattern(value, arguments);
    });
  }

  callback(null, chunk);
};

function getSubMatchers(args) {
  args = slice.call(args);
  return args.slice(0, -2);
}
function replacePattern(replacement, args) {
  var arr = args.length ? getSubMatchers(args) : args;
  return replacement ? replacement.replace(SUB_MATCH_RE, function(_, $1, $2) {
    if ($1 === '\\') {
      return $2;
    }
    if ($1 === '\\\\') {
      $1 = '\\';
    }
    $2 = $2.substring(1);
    if ($2 === '&') {
      $2 = 0;
    }
    return ($1 || '') + (arr[$2] || '');
  }) : '';
}
ReplacePatternTransform.replacePattern = replacePattern;
module.exports = ReplacePatternTransform;
