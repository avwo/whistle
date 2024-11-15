var qs = require('querystring');
var iconv = require('iconv-lite');
var util = require('../util');
var extend = require('extend');
var Buffer = require('safe-buffer').Buffer;
var mime = require('mime');
var pluginMgr = require('../plugins');
var config = require('../config');

var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;

var JSON_RE = /{[\w\W]*}|\[[\w\W]*\]/;
var MAX_REQ_SIZE = 1024 * 1024;
var MAX_HEADER_SIZE = 1024 * 8;
var CRLF = Buffer.from('\r\n');
var CR = CRLF[0];
var LF = CRLF[1];
var LINE = Buffer.from('-')[0];
var UPLOAD_CTN_SEP = Buffer.from('\r\n\r\n');
var CTN_DIS = 'Content-Disposition: form-data; name="';

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
var NAME_RE = /name=(?:"([^"]+)"|([^;]+))/i;

function getName(firstLine) {
  if (!NAME_RE.test(firstLine)) {
    return null;
  }
  var name = RegExp.$1;
  if (name) {
    return name;
  }
  name = RegExp.$2;
  if (name[0] === '\'') {
    var lastIndex = name.length - 1;
    if (name[lastIndex] === '\'') {
      return name.substring(1, lastIndex);
    }
  }
  return name;
}

function toMultipart(name, value) {
  if (value === undefined) {
    return null;
  }
  if (value == null) {
    value = '';
  }
  if (typeof value == 'object') {
    var filename = value.filename || value.name;
    var base64 = value.base64;
    var type = value.type;
    filename = filename == null ? name : filename + '';
    value = value.content || value.value || '';
    if (value && typeof value === 'object') {
      try {
        value = JSON.stringify(value, null, '  ');
      } catch (e) {}
    } else if (base64) {
      try {
        base64 = Buffer.from(base64, 'base64');
        value = '';
      } catch (e) {
        base64 = '';
      }
    }
    if (!util.isString(type)) {
      type = '';
    } else if (type.indexOf('/') === -1) {
      type = mime.lookup(type, type);
    }
    value = Buffer.from(CTN_DIS + name + '"; filename="' + filename
      + '"\r\nContent-Type: ' + (type || mime.lookup(filename)) + '\r\n\r\n' + value);
    return base64 ? Buffer.concat([value, base64]) : value;
  }
  return Buffer.from(CTN_DIS + name + '"\r\n\r\n' + value);
}

/**
 * 处理请求数据
 *
 * @param req：method、body、headers，top，bottom，speed、delay，charset,timeout
 * @param data
 */
function handleReq(req, data, reqRules, delType) {
  extend(req.headers, data.headers);
  if (reqRules.reqType) {
    var newType = util.getMatcherValue(reqRules.reqType).split(';');
    var type = newType[0];
    newType[0] =
      !type || type.indexOf('/') != -1
        ? type
        : REQ_TYPE[type] || REQ_TYPE.defaultType;
    req.headers['content-type'] = util.getNewType(newType.join(';'), req.headers);
  }
  util.setCharset(req.headers, data.charset, delType.reqType, delType.reqCharset);
  if (!util.hasRequestBody(req.method)) {
    delete data.top;
    delete data.bottom;
    delete data.body;
    delete req.headers['content-length'];
  } else {
    util.removeReqBody(req, data);
    if (data.top || data.bottom || data.body) {
      delete req.headers['content-length'];
      req._hasInjectBody = true;
    }
  }

  util.isWhistleTransformData(data) &&
    req.addZipTransform(new WhistleTransform(data));
  var opList = util.parseHeaderReplace(req.rules.headerReplace).req;
  if (opList) {
    var host = req.headers.host;
    var xff = req.headers[config.CLIENT_IP_HEAD];
    var clientId = req.headers[config.CLIENT_ID_HEAD];
    util.handleHeaderReplace(req.headers, opList);
    if (req.headers.host !== host) {
      req._customHost = req.headers.host;
    }
    if (xff !== req.headers[config.CLIENT_IP_HEAD]) {
      req._customXFF = req.headers[config.CLIENT_IP_HEAD];
    }
    if (clientId !== req.headers[config.CLIENT_ID_HEAD]) {
      req._customClientId = req.headers[config.CLIENT_ID_HEAD];
    }
  }
}

function handleAuth(data, auth) {
  auth = util.getAuthBasic(auth);
  auth && util.setHeader(data, 'authorization', auth);
}

function handleParams(req, params, urlParams) {
  params = util.isEmptyObject(params) ? null : params;
  var delProps = util.parseDelReqBody(req);
  var hasBody;
  var buffer;
  if (params || delProps) {
    var transform;
    var headers = req.headers;
    var isJson = util.isJSONContent(req);
    if (isJson || util.isUrlEncoded(req)) {
      delete headers['content-length'];
      transform = new Transform();
      var interrupt;
      transform._transform = function (chunk, _, callback) {
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
            } catch (e) {}
          }
          if (!body) {
            body = buffer + '';
          }
          if (isJson) {
            body = body.replace(JSON_RE, function (json) {
              var obj = util.parseRawJson(json);
              if (obj) {
                if (params) {
                  obj = extend(true, obj, params);
                }
                util.deleteProps(obj, delProps);
                json = JSON.stringify(obj);
              }
              return json;
            });
          } else {
            body = util.replaceQueryString(body, params, delProps);
          }
          if (isGBK) {
            try {
              body = iconv.encode(body, 'GB18030');
            } catch (e) {}
          } else {
            chunk = util.toBuffer(body);
          }
          buffer = null;
        } else if (params) {
          util.deleteProps(params, delProps);
          var data = isJson ? JSON.stringify(params) : qs.stringify(params);
          chunk = util.toBuffer(data);
        }

        callback(null, chunk);
      };
      req.addZipTransform(transform);
      hasBody = true;
    } else if (
      util.isMultipart(req) &&
      /boundary=(?:"([^"]+)"|([^;]+))/i.test(headers['content-type'])
    ) {
      delete headers['content-length'];
      var boundaryStr = '--' + (RegExp.$1 || RegExp.$2);
      var startBoundary = Buffer.from(boundaryStr + '\r\n');
      var boundary = Buffer.from('\r\n' + boundaryStr);
      var sepBoundary = Buffer.from('\r\n' + boundaryStr + '\r\n');
      var endBoudary = Buffer.from('\r\n' + boundaryStr + '--');
      var length = startBoundary.length;
      var endLength = sepBoundary.length;
      var minCtnLen = length + endLength;
      var preBuffer;
      var ended;
      var lastChunk;
      var badMultipart;
      var pass;
      var ignore;
      var result;

      transform = new Transform();

      if (delProps) {
        params = params || delProps;
        Object.keys(delProps).forEach(function(key) {
          params[key] = undefined;
        });
      }

      var getRestData = function() {
        var rest;
        Object.keys(params).forEach(function(name) {
          var part = toMultipart(name, params[name]);
          if (part) {
            if (rest) {
              rest.push(sepBoundary);
            } else {
              rest = [];
            }
            rest.push(part);
          }
        });
        if (!rest) {
          return null;
        }
        return rest.length < 2 ? rest[0] : Buffer.concat(rest);
      };

      var pushResult = function(buf, addSep) {
        if (buf && buf.length) {
          result = result || [];
          if (addSep) {
            if (startBoundary) {
              result.unshift(startBoundary);
              startBoundary = null;
            } else {
              result.push(sepBoundary);
            }
          }
          result.push(buf);
        }
      };
      var getResult = function() {
        if (ended) {
          pushResult(getRestData(), true);
        }
        if (!result) {
          return null;
        }
        if (ended && !pass && result.length) {
          result.push(endBoudary);
        }
        if (result.length < 2) {
          return result[0];
        }
        return Buffer.concat(result);
      };

      var getChunk = function() {
        result = null;
        while(!ended && buffer.length >= endLength) {
          var index = util.indexOfList(buffer, boundary);
          var isMatched = index !== -1;
          if (isMatched) {
            var first = buffer[index + length];
            var sec = buffer[index + length + 1];
            ended = first === LINE && sec === LINE;
            isMatched = ended || (first === CR && sec === LF);
          }
          if (ignore || pass) {
            if (!isMatched) {
              index = -endLength + 1;
              if (pass) {
                pushResult(buffer.slice(0, index));
              }
              buffer = buffer.slice(index);
              return getResult();
            }
            if (pass) {
              pushResult(buffer.slice(0, index));
            }
            buffer = buffer.slice(index + endLength);
            ignore = false;
            pass = false;
          } else {
            var part;
            var ctnIndex;
            var name;
            if (isMatched) {
              part = buffer.slice(0, index);
              ctnIndex = util.indexOfList(part, UPLOAD_CTN_SEP);
              if (ctnIndex !== -1) {
                name = getName(buffer.slice(0, ctnIndex) + '');
                if (name != null && (name in params)) {
                  part = toMultipart(name, params[name]);
                  params[name] = undefined;
                }
              }
              pushResult(part, true);
              buffer = buffer.slice(index + endLength);
            } else {
              ctnIndex = util.indexOfList(buffer, UPLOAD_CTN_SEP);
              if (ctnIndex !== -1) {
                name = getName(buffer.slice(0, ctnIndex) + '');
                pass = name == null || !(name in params);
                index = -endLength + 1;
                if (pass) {
                  pushResult(buffer.slice(0, index), true);
                } else {
                  pushResult(toMultipart(name, params[name]), true);
                  params[name] = undefined;
                  ignore = true;
                }
                buffer = buffer.slice(index);
              } else {
                if (buffer.length > MAX_HEADER_SIZE) {
                  badMultipart = true;
                  pass = true;
                  pushResult(buffer, true);
                }
                return getResult();
              }
            }
          }
        }
        if (pass && lastChunk) {
          pushResult(buffer);
        }
        return getResult();
      };

      var getCustomData = function() {
        var chunk = lastChunk ? getRestData() : null;
        return chunk && Buffer.concat([startBoundary, chunk, endBoudary]);
      };

      transform._transform = function (chunk, _, callback) {
        if (ended) {
          return callback();
        }
        if (badMultipart) {
          return callback(null, chunk);
        }

        lastChunk = !chunk;
        if (chunk && preBuffer !== null) {
          preBuffer = preBuffer ? Buffer.concat([preBuffer, chunk]) : chunk;
          if (!preBuffer || preBuffer.length <= length) {
            return callback(null, lastChunk ? preBuffer : null);
          }
          if (!util.startWithList(preBuffer, startBoundary)) {
            lastChunk = true;
            if (chunk = getCustomData()) {
              ended = true;
            } else {
              badMultipart = true;
              chunk = preBuffer;
            }
            return callback(null, chunk);
          }
          chunk = preBuffer.slice(length);
          preBuffer = null;
        }

        buffer = buffer && chunk ? Buffer.concat([buffer, chunk]) : (buffer || chunk);
        if (!buffer || buffer.length < minCtnLen) {
          return callback(null, getCustomData());
        }
        callback(null, getChunk());
      };
      req.addZipTransform(transform);
      hasBody = true;
    }
    var matcher = req.rules.params && req.rules.params.matcher;
    if (matcher && !matcher.indexOf(' params://')) {
      hasBody = true;
    }
  }
  var _params = hasBody ? null : params;
  if (_params || urlParams) {
    req._urlParams =
      urlParams && _params ? extend(_params, urlParams) : _params || urlParams;
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

  Object.keys(replacement).forEach(function (pattern) {
    var value = replacement[pattern];
    if (
      util.isOriginalRegExp(pattern) &&
      (pattern = util.toOriginalRegExp(pattern))
    ) {
      req.addTextTransform(new ReplacePatternTransform(pattern, value));
    } else if (pattern) {
      req.addTextTransform(new ReplaceStringTransform(pattern, value));
    }
  });
}

module.exports = function (req, res, next) {
  var reqRules = req.rules;
  var authObj = util.getAuthByRules(reqRules);

  util.parseRuleJson(
    [
      reqRules.reqHeaders,
      reqRules.reqCookies,
      authObj ? null : reqRules.auth,
      reqRules.params,
      reqRules.reqCors,
      reqRules.reqReplace,
      reqRules.urlReplace,
      reqRules.urlParams
    ],
    function (
      headers,
      cookies,
      auth,
      params,
      cors,
      replacement,
      urlReplace,
      urlParams
    ) {
      var data = {};
      if (headers) {
        data.headers = extend(data.headers || {}, headers);
      }
      if (data.body && typeof data.body !== 'string') {
        try {
          data.body = JSON.stringify(data.body);
        } catch (e) {}
      }

      if (data.headers) {
        data.headers = util.lowerCaseify(data.headers, req.rawHeaderNames);
        req._customHost = data.headers.host;
        req._customXFF = data.headers[config.CLIENT_IP_HEAD];
        req._customClientId = data.headers[config.CLIENT_ID_HEAD];
        if (typeof data.headers['content-type'] !== 'string') {
          delete data.headers['content-type'];
        }
      }

      if (reqRules.method) {
        var method = util.getMatcherValue(reqRules.method);
        data.method = method;
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

      var reqSpeed = util.getMatcherValue(reqRules.reqSpeed);
      reqSpeed = reqSpeed && parseFloat(reqSpeed);
      if (reqSpeed > 0) {
        data.speed = reqSpeed;
      }
      var cookie = data.headers && data.headers.cookie;
      if (typeof cookie !== 'string') {
        if (Array.isArray(cookie)) {
          cookie = cookie.join('; ');
        } else {
          cookie = req.headers.cookie;
        }
      }
      util.setReqCookies(data, cookies, cookie, req);
      handleAuth(data, auth || authObj);
      util.setReqCors(data, cors);
      req.method = util.getMethod(data.method || req.method);
      var bodyList = [
        reqRules.reqBody,
        reqRules.reqPrepend,
        reqRules.reqAppend
      ];
      util.getRuleValue(
        bodyList,
        function (reqBody, reqPrepend, reqAppend) {
          if (reqBody != null) {
            data.body = reqBody || util.EMPTY_BUFFER;
          }

          if (reqPrepend) {
            data.top = reqPrepend;
          }

          if (reqAppend) {
            data.bottom = reqAppend;
          }
          var delType = {};
          var queryProps = util.parseDelQuery(req, delType);
          handleReq(req, data, reqRules, delType);
          handleParams(req, params, urlParams);
          if (req._urlParams || urlReplace || queryProps || req._delQueryString) {
            var options = req.options;
            var isUrl = util.isUrl(options.href);
            var newUrl = isUrl ? options.href : req.fullUrl;
            if (req._urlParams) {
              newUrl = util.replaceUrlQueryString(newUrl, req._urlParams);
            }
            if (urlReplace) {
              newUrl = util.parsePathReplace(newUrl, urlReplace);
            }
            newUrl = util.deleteQuery(newUrl, queryProps, req._delQueryString);
            if (newUrl !== options.href) {
              if (isUrl) {
                req.options = util.parseUrl(newUrl);
              } else {
                req._realUrl = newUrl;
              }
            }
          }
          util.removeUnsupportsHeaders(req.headers);
          util.disableReqProps(req);
          handleReplace(req, replacement);
          var reqWriter = util.hasRequestBody(req)
            ? util.getRuleFile(reqRules.reqWrite)
            : null;
          util.getFileWriters(
            [reqWriter, util.getRuleFile(reqRules.reqWriteRaw)],
            function (writer, rawWriter) {
              if (writer) {
                req.addZipTransform(
                  new FileWriterTransform(writer, req, false, false, true)
                );
              }
              if (rawWriter) {
                req.addZipTransform(
                  new FileWriterTransform(rawWriter, req, true, false, true)
                );
              }
              pluginMgr.postStats(req);
              next();
            },
            util.isEnable(req, 'forceReqWrite')
          );
        },
        !util.hasRequestBody(req.method),
        null,
        null,
        req
      );
    },
    req
  );
};
