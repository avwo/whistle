var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');
var Buffer = require('safe-buffer').Buffer;
var fileMgr = require('./file-mgr');

var DOCTYPE = Buffer.from('<!DOCTYPE html>\r\n');

function WhistleTransform(options) {
  Transform.call(this);
  options = options || {};
  var value = parseInt((options.speed * 1000) / 8);
  if (value > 0) {
    this._speed = value;
  }
  if ((value = parseInt(options.delay)) > 0) {
    this._delay = value;
  }

  var charset = options.charset && String(options.charset);
  if (!iconv.encodingExists(charset)) {
    charset = 'utf8';
  }
  this._isHtml = options.isHtml;
  this._body = getBuffer(options, 'body', charset);
  this._top = getBuffer(options, 'top', charset);
  this._bottom = getBuffer(options, 'bottom', charset);
  if (this._body || this._top || this._bottom) {
    if (options.strictHtml) {
      this._strictHtml = true;
    } else if (options.safeHtml) {
      this._safeHtml = true;
    }
  }
}

function getBuffer(options, name, charset) {
  var buf = options[name];
  if (buf == null || Array.isArray(buf) || Buffer.isBuffer(buf)) {
    return buf;
  }
  return iconv.encode(buf + '', charset);
}

util.inherits(WhistleTransform, Transform);

function filterHtml(list, isSafe) {
  if (!Array.isArray(list)) {
    return list;
  }
  list = list.filter(function(buf) {
    if (!buf || buf._strictHtml) {
      return false;
    }
    if (isSafe || !buf._safeHtml) {
      return true;
    }
    return false;
  });
  return fileMgr.joinData(list);
}

function joinData(list) {
  return Array.isArray(list) ? fileMgr.joinData(list) : list;
}

WhistleTransform.prototype.allowInject = function (chunk) {
  if (!this._isHtml) {
    return true;
  }
  var first = chunk && chunk.toString().trim()[0];
  var isStrict = !first || first === '<';
  if (isStrict || this._strictHtml) {
    if (isStrict) {
      this._top = joinData(this._top);
      this._body = joinData(this._body);
      this._bottom = joinData(this._bottom);
    }
    return isStrict;
  }
  var isSafe = first !== '{' && first !== '[';
  if (this._safeHtml && !isSafe) {
    return false;
  }
  this._top = filterHtml(this._top, isSafe);
  this._body = filterHtml(this._body, isSafe);
  this._bottom = filterHtml(this._bottom, isSafe);
  return true;
};

WhistleTransform.prototype._transform = function (chunk, encoding, callback) {
  var self = this;
  var cb = function () {
    if (self._allowInject && self._ended && self._bottom) {
      chunk = chunk ? Buffer.concat([chunk, self._bottom]) : self._bottom;
      self._bottom = null;
    }
    if (chunk && self._speed) {
      setTimeout(function () {
        callback(null, chunk);
      }, Math.round((chunk.length * 1000) / self._speed));
    } else {
      callback(null, chunk);
    }
  };

  if (!self._ended) {
    self._ended = !chunk;
  }

  if (!self._inited) {
    self._allowInject = self.allowInject(chunk);
    self._inited = true;
    if (self._allowInject) {
      if (self._body) {
        self._ended = true;
        chunk = self._body;
        self._body = null;
      }
      var top = self._top;
      if (top) {
        if (self._isHtml) {
          top = Buffer.concat([DOCTYPE, top]);
        }
        chunk = chunk ? Buffer.concat([top, chunk]) : top;
        self._top = null;
      }
    }
    return self._delay ? setTimeout(cb, self._delay) : cb();
  }

  if (self._ended) {
    chunk = null;
  }

  cb();
};

module.exports = WhistleTransform;
