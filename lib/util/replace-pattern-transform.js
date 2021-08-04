var Transform = require('pipestream').Transform;
var util = require('util');

var LENGTH = 5120;
var slice = [].slice;
var SUB_MATCH_RE = /(^|..?)?(\$[&\d])/g;

function ReplacePatternTransform(pattern, value) {
  Transform.call(this);
  this._pattern = pattern;
  this._value = value == null ? '' : value + '';
  this._rest = '';
}

util.inherits(ReplacePatternTransform, Transform);

var proto = ReplacePatternTransform.prototype;
proto._transform = function(chunk, _, callback) {
  if (chunk != null) {
    chunk = this._rest + chunk;
    var index = 0;
    var value = this._value;
    var len = chunk.length;
    var result = chunk.replace(this._pattern, function() {
      var matcher = arguments[0];
      var i = arguments[arguments.length - 2] + arguments[0].length;
      if (i === len) {
        return matcher;
      }
      index = i;
      return replacePattern(value, arguments);
    });
    index = Math.max(index, chunk.length + 1 - LENGTH);
    this._rest = chunk.substring(index);
    chunk = result.substring(0, result.length - this._rest.length);
  } else if (this._rest) {
    chunk = this._rest.replace(this._pattern, function() {
      return replacePattern(this._value, arguments);
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
    if ($1 === '\\\\') {
      $1 = '\\';
    } else {
      $1 = $1 || '';
      var lastChar = $1[1] || $1[0];
      if (lastChar === '\\') {
        return $1.slice(0, -1) + $2;
      }
    }
    $2 = $2.substring(1);
    if ($2 === '&') {
      $2 = 0;
    }
    return $1 + (arr[$2] || '');
  }) : '';
}
ReplacePatternTransform.replacePattern = replacePattern;
module.exports = ReplacePatternTransform;
