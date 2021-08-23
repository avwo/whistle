var fs = require('fs');
var extend = require('extend');
var util = require('../util');
var mime = require('mime');
var qs = require('querystring');
var Buffer = require('safe-buffer').Buffer;
var PassThrough = require('stream').PassThrough;
var protoMgr = require('../rules/protocols');
var CRLF_RE = /\r\n|\r|\n/g;
var RAW_FILE_RE = /rawfile/;
var HEADERS_SEP_RE = /(\r?\n(?:\r\n|\r|\n)|\r\r\n?)/;
var MAX_HEADERS_SIZE = 256 * 1024;
var TPL_RE = /(?:dust|tpl|jsonp):$/;

function isTplProtocol(protocol) {
  return TPL_RE.test(protocol);
}

function isRawFileProtocol(protocol) {
  return RAW_FILE_RE.test(protocol);
}

function readFiles(files, callback) {
  var file = files.shift();
  var execCallback = function(err, stat) {
    if(!err && stat && stat.isFile()) {
      callback(null, file, stat.size);
    } else if (files.length) {
      readFiles(files, callback);
    } else {
      callback(err || new Error('Not found file ' + file), file);
    }
  };

  !file || typeof file != 'string' ? execCallback() : fs.stat(file, execCallback);
}

function parseRes(str, rawHeaderNames, fromValue) {
  if (!str) {
    return {
      statusCode: 200,
      headers: {}
    };
  }
  var headers = str.split(CRLF_RE);
  var statusLine = headers.shift().trim().split(/\s+/g);
  headers = util.parseHeaders(headers, rawHeaderNames);
  if (fromValue) {
    delete headers['content-encoding'];
  }
  return {
    statusCode: statusLine[1] || 200,
    headers: headers
  };
}

function addLength(reader, length) {
  reader.headers['content-length'] = length;
}

function getRawResByValue(body) {
  var headers;
  if (HEADERS_SEP_RE.test(body)) {
    var crlfStr = RegExp.$1;
    var index = body.indexOf(crlfStr);
    headers = body.substring(0, index);
    body = body.substring(index + crlfStr.length);
  }
  var rawHeaderNames = {};
  var reader = parseRes(headers, rawHeaderNames, true);
  reader.rawHeaderNames = rawHeaderNames;
  reader.body = body;
  addLength(reader, body ? Buffer.byteLength(body) : 0);
  return reader;
}

function getRawResByPath(protocol, path, req, size, callback) {
  var isRawFile = isRawFileProtocol(protocol);
  var range = isRawFile ? undefined : util.parseRange(req, req.localFileSize);
  var reader = fs.createReadStream(path, range);
  var rawHeaderNames = reader.rawHeaderNames = rawHeaderNames;
  if (isRawFile) {
    var buffer;
    var response = function(err, crlf) {
      reader.removeAllListeners();
      reader.on('error', util.noop);
      var stream = reader;
      reader = new PassThrough();
      if (err) {
        var stack = util.getErrorStack(err);
        reader.statusCode = 500;
        reader.push(stack);
        reader.push(null);
        size = Buffer.byteLength(stack);
      } else {
        if (crlf) {
          crlf = util.toBuffer(crlf);
          var index = util.indexOfList(buffer, crlf);
          if (index != -1) {
            extend(reader, parseRes(buffer.slice(0, index) + '', rawHeaderNames));
            var headerLen = index + crlf.length;
            size -= headerLen;
            buffer = buffer.slice(headerLen);
          }
        }
        buffer && reader.push(buffer);
        stream.on('error', function(err) {
          reader.emit('error', err);
        });
        stream.pipe(reader);
      }
      callback(reader, null, size);
    };

    reader.on('data', function(data) {
      buffer = buffer ? Buffer.concat([buffer, data]) : data;
      if (HEADERS_SEP_RE.test(buffer + '')) {
        response(null, RegExp.$1);
      } else if (buffer.length > MAX_HEADERS_SIZE) {
        response();
      }
    });
    reader.on('error', response);
    reader.on('end', response);
  } else {
    callback(reader, range, size);
  }
}

function addRangeHeaders(res, range, size) {
  if (!range) {
    return;
  }
  var headers = res.headers;
  headers['content-range'] = 'bytes ' + (range.start + '-' + range.end) + '/' + size;
  headers['accept-ranges'] = 'bytes';
  headers['content-length'] = range.end - range.start + 1;
  res.statusCode = 206;
}

module.exports = function(req, res, next) {
  var options = req.options;
  var config = this.config;
  var protocol = options && options.protocol;
  if (!protoMgr.isFileProxy(protocol)) {
    return next();
  }
  var defaultType = mime.lookup(req.fullUrl.replace(/[?#].*$/, ''), 'text/html');
  var rules = req.rules;
  var rule = rules.rule;
  delete rules.proxy;
  delete rules.host;
  if (rule.value) {
    var body = util.removeProtocol(rule.value, true);
    var isRawFile = isRawFileProtocol(protocol);
    var reader = isRawFile ? getRawResByValue(body) : {
      statusCode: 200,
      body: body,
      headers: {
        'content-type': (rule.key ? mime.lookup(rule.key, defaultType) : defaultType) + '; charset=utf-8'
      }
    };

    if (isTplProtocol(protocol)){
      reader.realUrl = rule.matcher;
      render(reader);
    } else {
      if (!isRawFile) {
        var size = Buffer.byteLength(body);
        var range = util.parseRange(req, size);
        if (range) {
          body = Buffer.from(body);
          reader.body = body.slice(range.start, range.end + 1);
          addRangeHeaders(reader, range, size);
        } else {
          addLength(reader, size);
        }
      }
      reader = util.wrapResponse(reader);
      reader.realUrl = rule.matcher;
      res.response(reader);
    }
    return;
  }

  readFiles(util.getRuleFiles(rule), function(err, path, size) {
    if (err) {
      if (/^x/.test(protocol)) {
        var fullUrl = /^xs/.test(protocol) ? req.fullUrl.replace(/^http:/, 'https:') : req.fullUrl;
        extend(options, util.parseUrl(fullUrl));
        next();
      } else {
        var notFound = util.wrapResponse({
          statusCode: 404,
          body: 'Not found file <strong>' + path + '</strong>',
          headers: {
            'content-type': 'text/html; charset=utf-8'
          }
        });
        notFound.realUrl = rule.matcher;
        res.response(notFound);
      }
      return;
    }

    var headers = {
      'server': config.name,
      'content-type': mime.lookup(path, defaultType) + '; charset=utf-8'
    };

    if (isTplProtocol(protocol)) {
      var reader = {
        statusCode: 200,
        realUrl: path,
        headers: headers
      };
      fs.readFile(path, {encoding: 'utf8'}, function(err, data) {
        if (err) {
          return util.emitError(req, err);
        }
        reader.body = data;
        render(reader);
      });
    } else {
      req.localFileSize = size;
      getRawResByPath(protocol, path, req, size, function(reader, range, realSize) {
        reader.realUrl = path;
        reader.statusCode = reader.statusCode || 200;
        reader.headers = reader.headers || headers;
        addRangeHeaders(reader, range, size);
        !range && addLength(reader, realSize);
        res.response(reader);
      });
    }
  });

  function render(reader) {
    if (reader.body) {
      var data = qs.parse(util.getQueryString(req.fullUrl));
      if (Object.keys(data).length) {
        reader.body = reader.body.replace(/\$?\{([\w\-$]+)\}/g, function(all, matched) {
          var value = data[matched];
          if (value === undefined) {
            return all;
          }
          return util.getQueryValue(value);
        });
      }
      addLength(reader, Buffer.byteLength(reader.body));
    } else {
      addLength(reader, 0);
    }
    var realUrl = reader.realUrl;
    reader = util.wrapResponse(reader);
    reader.realUrl = realUrl;
    res.response(reader);
  }
};
