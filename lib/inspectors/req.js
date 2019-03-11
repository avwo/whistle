var qs = require('querystring');
var iconv = require('iconv-lite');
var url = require('url');
var util = require('../util');
var extend = require('extend');
var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;
var hparser = require('hparser');
var toMultiparts = hparser.toMultiparts;
var MultipartParser = hparser.MultipartParser;

var JSON_RE = /{[\w\W]*}|\[[\w\W]*\]/;
var MAX_REQ_SIZE = 256 * 1024;
var REQ_TYPE = {
  urlencoded: 'application/x-www-form-urlencoded',
  form: 'application/x-www-form-urlencoded',
  json: 'application/json',
  xml: 'text/xml',
  text: 'text/plain',
  upload: 'multipart/form-data',
  multipart: 'multipart/form-data',
  defaultType: 'application/octet-stream'
};

/**
* 处理请求数据
*
* @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
* @param data
*/
function handleReq(req, data) {
  var method = util.getMethod(data.method || req.method);
  req.method = method;
  req.timeout = parseInt(data.timeout, 10);
  extend(req.headers, data.headers);
  if (typeof data.charset == 'string') {
    var type = req.headers['content-type'];
    var charset = '; charset=' + data.charset;
    if (typeof type == 'string') {
      req.headers['content-type'] = type.split(';')[0] + charset;
    } else {
      req.headers['content-type'] = charset;
    }
  } else {
    delete data.charset;
  }
  if (!util.hasRequestBody(method)) {
    delete data.top;
    delete data.bottom;
    delete data.body;
    delete req.headers['content-length'];
  } else if (data.top || data.bottom || data.body) {
    delete req.headers['content-length'];
  }

  util.isWhistleTransformData(data) && req.addZipTransform(new WhistleTransform(data));
}

function handleAuth(data, auth) {
  if (!auth) {
    return;
  }

  var basic = [];
  auth.username != null && basic.push(auth.username);
  auth.password != null && basic.push(auth.password);
  if (basic = basic.join(':')) {
    util.setHeader(data, 'authorization', 'Basic ' + util.toBuffer(basic).toString('base64'));
  }
}

function handleParams(req, params) {
  var _params = params;
  if (!(params = params && qs.stringify(params))) {
    return;
  }

  var transform;
  var headers = req.headers;
  var isJson = util.isJSONContent(req);
  if (isJson || util.isUrlEncoded(req)) {
    delete headers['content-length'];
    transform = new Transform();
    var buffer, interrupt;
    transform._transform = function(chunk, encoding, callback) {
      if (chunk) {
        if (!interrupt) {
          buffer = buffer ? Buffer.concat([buffer, chunk]) : chunk;
          chunk = null;
          if (buffer.length > MAX_REQ_SIZE) {
            interrupt = true;
            chunk = buffer;
            buffer = null;
          }
        }
      } else if (buffer && buffer.length) {
        var body;
        var isGBK = !util.isUtf8(buffer);
        if (isGBK) {
          try {
            body = iconv.decode(buffer, 'GB18030');
          } catch(e) {}
        }
        if (!body) {
          body = buffer + '';
        }
        if (isJson) {
          body = body.replace(JSON_RE, function(json) {
            var obj = util.parseRawJson(json);
            return obj ? JSON.stringify(extend(true, obj, _params)) : json;
          });
        } else {
          body = util.replaceQueryString(body, params);
        }
        if (isGBK) {
          try {
            body = iconv.encode(body, 'GB18030');
          } catch(e) {}
        } else {
          chunk = util.toBuffer(body);
        }
        buffer = null;
      } else {
        var data = params;
        if (isJson) {
          try {
            data = JSON.stringify(_params);
          } catch(e) {}
        }
        chunk = util.toBuffer(data);
      }

      callback(null, chunk);
    };
    req.addZipTransform(transform);
  } else if (util.isMultipart(req) && /boundary=(?:"([^"]+)"|([^;]+))/i.test(headers['content-type'])) {
    delete headers['content-length'];
    var boundaryStr = '--' + (RegExp.$1 || RegExp.$2);
    var startBoundary = util.toBuffer(boundaryStr + '\r\n');
    var boundary = util.toBuffer('\r\n' + boundaryStr);
    var sepBoundary = util.toBuffer('\r\n' + boundaryStr + '\r\n');
    var endBoudary = util.toBuffer('\r\n' + boundaryStr + '--');
    var length = startBoundary.length;
    var sepLength = sepBoundary.length;
    transform = new Transform();

    transform.parse = function(chunk) {
      var index, result, sep, data;
      while((index = util.indexOfList(chunk, boundary)) != -1
          && ((sep = util.startWithList(chunk, sepBoundary, index))
              || util.startWithList(chunk, endBoudary, index))) {
        data = this.parser.transform(chunk.slice(0, index));
        result = result && data ? Buffer.concat([result, data]) : (result || data);
        if (!sep) {
          data = toMultiparts(_params, boundaryStr);
          result = result ? Buffer.concat([result, data]) : data;
        }
        sep = sep ? sepBoundary : endBoudary;
        result = result ? Buffer.concat([result, sep]) : sep;
        chunk = chunk.slice(index + sepLength);
        this.parser = new MultipartParser(_params);
      }

      var len = chunk.length;
      if (len >= sepLength) {
        var lastIndex = len - sepLength + 1;
        data = this.parser.transform(chunk.slice(0, lastIndex));
        chunk = chunk.slice(lastIndex);
        result = result && data ? Buffer.concat([result, data]) : (result || data);
      }
      this.buffer = chunk;

      return result;
    };
    transform._transform = function(chunk, encoding, callback) {
      if (this.badMultipart) {
        return callback(null, chunk);
      }

      var end;
      if (chunk) {
        chunk = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
      } else {
        end = true;
        chunk = this.buffer;
      }

      if (chunk) {
        this.buffer = null;
        if (!this.parser) {
          if (util.startWithList(chunk, startBoundary)) {
            this.parser = new MultipartParser(_params);
            chunk = this.parse(chunk.slice(length));
            chunk = chunk ? Buffer.concat([startBoundary, chunk]) : startBoundary;
          } else if(end || chunk.length >= length) {
            this.badMultipart = true;
          } else {
            this.buffer = chunk;
            chunk = null;
          }
        } else {
          chunk = this.parse(chunk);
        }
      }

      if (end && this.buffer) {
        chunk = chunk ? Buffer.concat([chunk, this.buffer]) : this.buffer;
      }
      callback(null, chunk);
    };
    req.addZipTransform(transform);
  } else if (/^https?:/.test(req.options.href)) {
    var newUrl = util.replaceUrlQueryString(req.options.href, params);
    req.options = util.parseUrl(newUrl);
  }
}

function handleUrlReplace(req, params) {
  var newUrl = util.parsePathReplace(req.options.href, params);
  if (newUrl) {
    req.options = url.parse(newUrl);
  }
}

function handleReplace(req, replacement) {
  if (!util.hasRequestBody(req) || !replacement) {
    return;
  }

  var type = req.headers['content-type'];
  type = util.isUrlEncoded(req) ? 'FORM' : util.getContentType(type);
  if (!type || type == 'IMG') {
    return;
  }

  Object.keys(replacement).forEach(function(pattern) {
    var value = replacement[pattern];
    if (util.isOriginalRegExp(pattern) && (pattern = util.toOriginalRegExp(pattern))) {
      req.addTextTransform(new ReplacePatternTransform(pattern, value));
    } else if (pattern) {
      req.addTextTransform(new ReplaceStringTransform(pattern, value));
    }
  });
}

module.exports = function(req, res, next) {
  var reqRules = req.rules;
  var authObj;
  if (reqRules.auth) {
    authObj = util.getMatcherValue(reqRules.auth);
    if (/[\\\/]/.test(authObj)) {
      authObj = null;
    } else {
      var index = authObj.indexOf(':');
      authObj = {
        username: index == -1 ? authObj : authObj.substring(0, index),
        password: index == -1 ? null : authObj.substring(index + 1)
      };
    }
  }
  var reqCors = util.getReqCors(reqRules.reqCors);
  var cors = reqCors ? null : reqRules.reqCors;
  util.parseRuleJson([reqRules.reqHeaders, reqRules.reqCookies,
authObj ? null : reqRules.auth, reqRules.params, cors, reqRules.reqReplace, reqRules.urlReplace],
function(headers, cookies, auth, params, cors, replacement, urlReplace) {
  var data = {};
  if (headers) {
    data.headers =  extend(data.headers || {}, headers);
  }
  if (data.body && typeof data.body !== 'string') {
    try {
      data.body = JSON.stringify(data.body);
    } catch(e) {}
  }

  if (data.headers) {
    data.headers = util.lowerCaseify(data.headers, req.rawHeaderNames);
    req._customHost = data.headers.host;
    req._customXFF = data.headers['x-forwarded-for'];
  }

  if (reqRules.method) {
    var method = util.getMatcherValue(reqRules.method);
    data.method = method;
  }

  if (reqRules.reqType) {
    var newType = util.getMatcherValue(reqRules.reqType).split(';');
    var type = newType[0];
    newType[0] = (!type || type.indexOf('/') != -1) ? type : (REQ_TYPE[type] || REQ_TYPE.defaultType);
    type = newType.join(';');
    if (type.indexOf(';') == -1) {
      var origType = req.headers['content-type'];
      if (typeof origType == 'string' && origType.indexOf(';') != -1) {
        origType = origType.split(';');
        origType[0] = type;
        type = origType.join(';');
      }
    }
    util.setHeader(data, 'content-type', type);
  }

  if (reqRules.reqCharset) {
    data.charset = util.getMatcherValue(reqRules.reqCharset);
  }

  if (reqRules.referer) {
    var referer = util.getMatcherValue(reqRules.referer);
    util.setHeader(data, 'referer', referer);
  }

  if (reqRules.ua) {
    var ua = util.getMatcherValue(reqRules.ua);
    util.setHeader(data, 'user-agent', ua);
  }

  var reqDelay = util.getMatcherValue(reqRules.reqDelay);
  reqDelay = reqDelay && parseInt(reqDelay, 10);
  if (reqDelay > 0) {
    data.delay = reqDelay;
  }

  var reqSpeed = util.getMatcherValue(reqRules.reqSpeed);
  reqSpeed = reqSpeed && parseFloat(reqSpeed);
  if (reqSpeed > 0) {
    data.speed = reqSpeed;
  }

  util.setReqCookies(data, cookies, req.headers.cookie);
  handleAuth(data, auth || authObj);
  util.setReqCors(data, cors || reqCors);

  util.readInjectFiles(data, function(data) {
    var bodyList = [reqRules.reqBody, reqRules.reqPrepend, reqRules.reqAppend];
    util.getRuleValue(bodyList, function(reqBody, reqPrepend, reqAppend) {
      if (reqBody) {
        data.body = reqBody;
      }

      if (reqPrepend) {
        data.top = reqPrepend;
      }

      if (reqAppend) {
        data.bottom = reqAppend;
      }

      handleReq(req, data);
      handleParams(req, params);
      handleUrlReplace(req, urlReplace);
      util.removeUnsupportsHeaders(req.headers);
      util.disableReqProps(req);
      handleReplace(req, replacement);
      var reqWriter = util.hasRequestBody(req) ? util.getRuleFile(reqRules.reqWrite) : null;
      util.getFileWriters([reqWriter, util.getRuleFile(reqRules.reqWriteRaw)], function(writer, rawWriter) {
        if (writer) {
          req.addZipTransform(new FileWriterTransform(writer, req, false, false, true));
        }
        if (rawWriter) {
          req.addZipTransform(new FileWriterTransform(rawWriter, req, true, false, true));
        }
        next();
      });

    }, !util.hasRequestBody(req.method));
  });
});
};
