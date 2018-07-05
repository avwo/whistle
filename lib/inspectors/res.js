var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var mime = require('mime');
var extend = require('extend');
var util = require('../util');
var properties = require('../rules/util').properties;
var Transform = require('pipestream').Transform;
var WhistleTransform = util.WhistleTransform;
var SpeedTransform = util.SpeedTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;
var rules = require('../rules');
var pluginMgr = require('../plugins');
var hparser = require('hparser');
var formatHeaders = hparser.formatHeaders;
var getRawHeaderNames = hparser.getRawHeaderNames;

var LOCALHOST = '127.0.0.1';
var SCRIPT_START = util.toBuffer('<script>');
var SCRIPT_END = util.toBuffer('</script>');
var STYLE_START = util.toBuffer('<style>');
var STYLE_END = util.toBuffer('</style>');
var DOCTYPE = util.toBuffer('<!DOCTYPE html>\r\n');
var CRLF = util.toBuffer('\r\n');
var MAX_RES_SIZE = 512 * 1024;
var JSON_RE = /{[\w\W]*}|\[[\w\W]*\]/;
var LIKE_JSON_RE = /^\s*[\{\[]/;
var SOCKS_PROXY_RE = /^x?socks:\/\//;
var INTERNAL_PROXY_RE = /^x?internal-proxy:\/\//;
var HS2H_PROXY_RE = /^x?https2http-proxy:\/\//;
var H2HS_PROXY_RE = /^x?http2https-proxy:\/\//;
var X_PROXY_RE = /^x/;

function wrapJs(js, charset) {
  return js ? Buffer.concat([SCRIPT_START, util.toBuffer(js, charset), SCRIPT_END]) : '';
}

function wrapCss(css, charset) {
  return css ? Buffer.concat([STYLE_START, util.toBuffer(css, charset), STYLE_END]) : '';
}

function setCookies(headers, data) {
  var newCookies = data.headers['set-cookie'];
  if (newCookies) {
    var cookies = headers['set-cookie'];
    if (Array.isArray(cookies)) {
      var newNameMap = {};
      newCookies.forEach(function(cookie) {
        var index = cookie.indexOf('=');
        var name = index == -1 ? name : cookie.substring(0, index);
        newNameMap[name] = 1;
      });
      cookies.forEach(function(cookie) {
        var index = cookie.indexOf('=');
        var name = index == -1 ? name : cookie.substring(0, index);
        if (!newNameMap[name]) {
          newCookies.push(cookie);
        }
      });
    }
    headers['set-cookie'] = newCookies;
    delete data.headers['set-cookie'];
  }
}

function handleReplace(res, replacement) {
  if (!replacement) {
    return;
  }

  var type = util.getContentType(res.headers);
  if (!type || type == 'IMG') {
    return;
  }

  Object.keys(replacement).forEach(function(pattern) {
    var value = replacement[pattern];
    if (util.isOriginalRegExp(pattern) && (pattern = util.toOriginalRegExp(pattern))) {
      res.addTextTransform(new ReplacePatternTransform(pattern, value));
    } else if (pattern) {
      res.addTextTransform(new ReplaceStringTransform(pattern, value));
    }
  });
}

function getWriterFile(file, statusCode) {
  if (!file || statusCode == 200) {
    return file;
  }

  return file + '.' + statusCode;
}

module.exports = function(req, res, next) {
  var config = this.config;
  var responsed, timer;
  var resRules = req.rules;
  var deleteHeaders = util.parseDeleteProperties(req);

  req.request = function(options) {
    options = options || req.options;
    req.realUrl = res.realUrl = options.href;
    var originPort = options.port;
    var now = Date.now();
    rules.getProxy(options.href, options.isPlugin ? null : req, function(err, hostIp, hostPort) {
      var proxyUrl = !options.isPlugin && resRules.proxy ? resRules.proxy.matcher : null;
      var headers = req.headers;
      var curUrl;
      if (!hostIp) {
        if (options.localDNS && net.isIP(options.host)) {
          curUrl = options.host;
        } else if (proxyUrl) {
          var isInternalProxy = INTERNAL_PROXY_RE.test(proxyUrl);
          if (isInternalProxy || HS2H_PROXY_RE.test(proxyUrl)) {
            if (isInternalProxy && options.protocol === 'https:') {
              headers[config.HTTPS_FIELD] = 1;
            }
            options.protocol = null;
          } else if (H2HS_PROXY_RE.test(proxyUrl)) {
            options.protocol = 'https:';
          }
          curUrl = 'http:' + util.removeProtocol(proxyUrl);
        } else {
          curUrl = options.href;
        }
      }
      rules.resolveHost(curUrl, function(err, ip, port, host) {
        var setHostsInfo = function(_ip, _port, _host, withPort) {
          ip = _ip;
          port = _port;
          req.dnsTime = Date.now() - now;
          req.hostIp = (withPort && _port) ? _ip + ':' + _port : _ip;
          if (_host) {
            resRules.host = _host;
          }
        };
        setHostsInfo(hostIp || ip, hostPort || port, host);
        if (err) {
          res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(err)));
          return;
        }
        if (req.disable.keepalive) {
          req.disable.keepAlive = true;
        }
        var isHttps = options.protocol == 'https:';
        var proxyOptions, isProxyPort, isSocks;
        var setAgent = function() {
          options.agent = req.disable.keepAlive ? false : (isHttps ? config.httpsAgent : config.httpAgent);
        };
        if (proxyUrl) {
          proxyOptions = url.parse(proxyUrl);
          proxyOptions.host = ip;
          isSocks = SOCKS_PROXY_RE.test(proxyUrl);
          if (isHttps || isSocks) {
            isProxyPort = (proxyOptions.port || (isSocks ? 1080 : 80)) == config.port;
            if (isProxyPort && util.isLocalAddress(ip)) {
              res.response(util.wrapResponse({
                statusCode: 302,
                headers: {
                  location: 'http://' + ip + ':' + config.port + (options.path || '')
                }
              }));
            } else {
              var proxyHeaders = {
                host: options.hostname + ':' + (isHttps ? (options.port || 443) : 80),
                'proxy-connection': 'keep-alive',
                'user-agent': config.PROXY_UA
              };
              if (!util.isLocalAddress(req.clientIp)) {
                proxyHeaders[config.CLIENT_IP_HEAD] = req.clientIp;
              }
              if (isHttps) {
                util.checkIfAddInterceptPolicy(proxyHeaders, headers);
                if (isProxyPort) {
                  proxyHeaders[config.WEBUI_HEAD] = 1;
                }
              }
              var opts = {
                isHttps: isHttps,
                host: ip,
                clientIp: proxyHeaders[config.CLIENT_IP_HEAD],
                port: proxyOptions.port,
                url: options.href,
                auth: proxyOptions.auth,
                headers: proxyHeaders
              };
              options.agent = isSocks ? config.getSocksAgent(opts) : config.getHttpsAgent(opts);
              request(options);
            }
            return;
          }

          if (proxyOptions.auth) {
            headers['proxy-authorization'] = 'Basic ' + util.toBuffer(proxyOptions.auth + '').toString('base64');
          }
        }

        req.hostIp = port ? ip + ':' + port : ip;
        port = proxyOptions ? (proxyOptions.port || 80) : (port || options.port);
        options.host = ip;//设置ip
        isProxyPort = (port || (isHttps ? 443 : 80)) == config.port;
        if (isProxyPort && util.isLocalAddress(options.host)) {
          res.response(util.wrapResponse({
            statusCode: 302,
            headers: {
              location: 'http://' + ip + ':' + config.port + (options.path || '')
            }
          }));
        } else {
          if (isProxyPort) {
            headers[config.WEBUI_HEAD] = 1;
          }
          setAgent();
          request(options, port, true);
        }
        function request(options, serverPort, direct) {
          options.headers = headers;
          options.method = req.method;
          options.rejectUnauthorized = false;
          if (!options.isPlugin && (req.fullUrl !== req.realUrl || !headers.host)) {
            headers.host = options.hostname + (options.port ? ':' + options.port : '');
          }
          if (req.disable.keepAlive) {
            headers.connection = 'close';
            var rawNames = req.rawHeaderNames;
            if (rawNames && !rawNames.connection) {
              rawNames.connection = 'Connection';
            }
          }
          if (direct) {
            options.port = serverPort;
          }

          if (proxyUrl && direct) {
            options.path = options.href;
          }

          if (resRules.hostname) {
            headers.host = util.getMatcherValue(resRules.hostname);
          }
          delete options.hostname; //防止自动dns
          delete options.protocol;
          if (isHttps) {
            options.servername = headers.host.split(':')[0];
          }
          var maxRetryCount = 1;
          var retryCount = 0;
          var retryReq = function(err) {
            if (retryCount >= maxRetryCount) {
              res.response(util.wrapGatewayError(util.getErrorStack(err || new Error('Socket connect timeout'))));
              return;
            }
            ++retryCount;
            if (proxyUrl) {
              if (X_PROXY_RE.test(proxyUrl)) {
                proxyUrl = '';
                setAgent();
                rules.resolveHost(req.fullUrl, function(_err, _ip, _port, _host) {
                  setHostsInfo(_ip, _port, _host, true);
                  if (_err) {
                    res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(_err)));
                    return;
                  }
                  options.host = ip;
                  options.port = _port || originPort;
                  ++maxRetryCount;
                  _request();
                });
                return;
              }
            } else if (isHttps && util.checkAuto2Http(req, ip)) {
              ++maxRetryCount;
              if (maxRetryCount > 2 || util.checkTlsError(err)) {
                isHttps = false;
                setAgent();
              }
            }
            _request();
          };
          var _request = function() {
            try {
              clearTimeout(timer);
              if (req.setServerPort) {
                req.setServerPort(options.port || (isHttps ? 443 : 80));
              }
              var client = (isHttps ? https : http).request(options, res.response);
              client.on('error', retryReq);
              client.once('socket', function(socket) {
                if (socket.connecting || socket._connecting) {
                  socket.setTimeout(12000, retryReq);
                  socket.once((proxyUrl || !isHttps) ? 'connect' : 'secureConnect', function() {
                    socket.setTimeout(0);
                    retryCount = maxRetryCount;
                    req.pipe(client);
                  });
                } else {
                  retryCount = maxRetryCount;
                  req.pipe(client);
                }
              });
            } catch(e) {
              res.response(util.wrapGatewayError(util.getErrorStack(e)));
            }
          };
          if (req.disable.clientIp || req.disable.clientIP
            || util.isLocalAddress(headers[config.CLIENT_IP_HEAD])) {
            delete headers[config.CLIENT_IP_HEAD];
          } else {
            var forwardedFor = util.getMatcherValue(resRules.forwardedFor);
            if (forwardedFor) {
              headers[config.CLIENT_IP_HEAD] = forwardedFor;
            } else if (!config.keepXFF && !resRules.forwardedFor && !options.isPlugin && (isHttps || isSocks || !proxyUrl)) {
              delete headers[config.CLIENT_IP_HEAD];
            }
          }

          Object.keys(deleteHeaders.reqHeaders).forEach(function(prop) {
            delete headers[prop];
          });

          options.headers = formatHeaders(options.headers, req.rawHeaderNames);
          delete headers[config.WEBUI_HEAD];
          _request();
        }
      }, req.pluginRules, req.rulesFileMgr, req.headerRulesMgr);
    });
  };

  res.response = function(_res) {
    if (responsed) {
      return;
    }
    clearTimeout(timer);
    responsed = true;
    if (_res.realUrl) {
      req.realUrl = res.realUrl = _res.realUrl;
    }
    res.headers = _res.headers;
    res.trailers = _res.trailers;
    if (_res.rawHeaderNames) {
      res.rawHeaderNames = _res.rawHeaderNames;
    } else {
      res.rawHeaderNames = _res.rawHeaderNames = Array.isArray(_res.rawHeaders) ?
      getRawHeaderNames(_res.rawHeaders) : {};
    }
    pluginMgr.getResRules(req, _res, function() {
      var replaceStatus = util.getMatcherValue(resRules.replaceStatus);
      if (replaceStatus && replaceStatus != _res.statusCode) {
        res.statusCode = _res.statusCode = replaceStatus;
        util.handleStatusCode(replaceStatus, _res.headers);
      }
      if (req.disable['301'] && _res.statusCode == 301) {
        res.statusCode = _res.statusCode = 302;
      }

      var cors = resRules.resCors;
      var resCors = util.parseResCors(cors);
      if (resCors) {
        cors = null;
      }

      util.parseRuleJson([resRules.res, resRules.resHeaders, resRules.resCookies, cors, resRules.resReplace, resRules.resMerge],
function(data, headers, cookies, cors, replacement, params) {
  if (resRules.head && resRules.head.res) {
    data = extend(resRules.head.res, data);
  }

  data = data || {};

  if (headers) {
    data.headers = extend(data.headers || {}, headers);
  }

  if (data.body && typeof data.body !== 'string') {
    try {
      data.body = JSON.stringify(data.body);
    } catch(e) {}
  }

  if (data.headers) {
    data.headers = util.lowerCaseify(data.headers, res.rawHeaderNames);
  }

  util.setResCookies(data, cookies);
  util.setResCors(data, resCors, cors, req.headers.origin);

  var cache = util.getMatcherValue(resRules.cache);
  var maxAge = parseInt(cache, 10);
  var noCache = /^(?:no|no-cache|no-store)$/i.test(cache) || maxAge < 0;
  if (maxAge > 0 || noCache) {
    util.setHeaders(data, {
      'cache-control': noCache ? (/^no-store$/i.test(cache) ? 'no-store' : 'no-cache') : 'max-age=' + maxAge,
      'expires': new Date(Date.now() + (noCache ? -60000000 : maxAge * 1000)).toGMTString(),
      'pragma': noCache ? 'no-cache' : ''
    });
  }

  if (resRules.attachment) {
    var attachment = util.getMatcherValue(resRules.attachment) || util.getFilename(req.fullUrl);
    util.setHeader(data, 'content-disposition', 'attachment; filename="' + util.encodeNonAsciiChar(attachment) + '"');
    util.disableReqCache(req.headers);
  }

  if (resRules.location) {
    util.setHeader(data, 'location', util.getMatcherValue(resRules.location));
  }

  if (resRules.resType) {
    var newType = util.getMatcherValue(resRules.resType).split(';');
    var type = newType[0];
    newType[0] = (!type || type.indexOf('/') != -1) ? type : mime.lookup(type, type);
    util.setHeader(data, 'content-type', newType.join(';'));
  }

  if (resRules.resCharset) {
    data.charset = util.getMatcherValue(resRules.resCharset);
  }

  var resDelay = util.getMatcherValue(resRules.resDelay);
  resDelay = resDelay && parseInt(resDelay, 10);
  if (resDelay > 0) {
    data.delay = resDelay;
  }

  var resSpeed = util.getMatcherValue(resRules.resSpeed);
  resSpeed = resSpeed && parseFloat(resSpeed);
  if (resSpeed > 0) {
    data.speed = resSpeed;
  }

  util.readInjectFiles(data, function(data) {
    util.getRuleValue([resRules.resBody, resRules.resPrepend, resRules.resAppend,
      resRules.htmlAppend, resRules.jsAppend, resRules.cssAppend,
      resRules.htmlBody, resRules.jsBody, resRules.cssBody,
      resRules.htmlPrepend, resRules.jsPrepend, resRules.cssPrepend],
function(resBody, resPrepend, resAppend, htmlAppend, jsAppend, cssAppend,
  htmlBody, jsBody, cssBody, htmlPrepend, jsPrepend, cssPrepend) {
  if (resBody) {
    data.body = resBody;
  }

  if (resPrepend) {
    data.top = resPrepend;
  }

  if (resAppend) {
    data.bottom = util.toBuffer(resAppend);
  }


  var headers = _res.headers;
  var type;
  if (data.headers) {
    setCookies(headers, data);
    type = data.headers['content-type'];
    if (typeof type == 'string') {
      if (type.indexOf(';') == -1) {
        var origType = headers['content-type'];
        if (typeof origType == 'string' && origType.indexOf(';') != -1) {
          origType = origType.split(';');
          origType[0] = type;
          data.headers['content-type'] = origType.join(';');
        }
      }
    } else {
      delete data.headers['content-type'];
    }
    extend(headers, data.headers);
  }

  var charset;
  if (typeof data.charset == 'string') {
    type = headers['content-type'];
    charset = '; charset=' + data.charset;
    if (typeof type == 'string') {
      headers['content-type'] = type.split(';')[0] + charset;
    } else {
      headers['content-type'] = charset;
    }
  } else {
    delete data.charset;
  }
  if (!headers.pragma) {
    delete headers.pragma;
  }

  if (headers.location) {
//nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
    headers.location = util.encodeNonAsciiChar(headers.location);
  }

  var speedTransform = data.speed || data.delay ? new SpeedTransform(data) : null;
  delete data.headers;
  delete data.speed;
  delete data.delay;

  type = util.getContentType(headers);
  var isHtml = type === 'HTML' || !headers['content-type'];
  if ((isHtml || type === 'JSON' || type === 'JS') && params && Object.keys(params).length) {
    var transform = new Transform();
    var interrupt;
    var ctn = '';
    transform._transform = function(text, encoding, callback) {
      if (text) {
        if (!interrupt) {
          ctn += text;
          text = null;
          if ((isHtml && !LIKE_JSON_RE.test(ctn))
            || Buffer.byteLength(ctn) > MAX_RES_SIZE) {
            interrupt = true;
            text = ctn;
            ctn = null;
          }
        }
      } else if (ctn) {
        text = ctn.replace(JSON_RE, function(json) {
          var obj = util.parseRawJson(json);
          return obj ? JSON.stringify(extend(true, obj, params)) : json;
        });
        ctn = null;
      } else if (!interrupt) {
        try {
          ctn = JSON.stringify(params);
        } catch(e) {}
        text = util.toBuffer(ctn);
      }

      callback(null, text);
    };
    res.addTextTransform(transform);
  }
  charset = util.getCharset(headers['content-type']);
  var top, body, bottom;
  switch(type) {
  case 'HTML':
    top = wrapCss(cssPrepend, charset);
    body = wrapCss(cssBody, charset);
    bottom = wrapCss(cssAppend, charset);

    if (htmlPrepend) {
      htmlPrepend = util.toBuffer(htmlPrepend, charset);
      top = top ? Buffer.concat([top, htmlPrepend]) : htmlPrepend;
    }
    if (htmlBody) {
      htmlBody = util.toBuffer(htmlBody, charset);
      body = body ? Buffer.concat([body, htmlBody]) : htmlBody;
    }
    if (htmlAppend) {
      htmlAppend = util.toBuffer(htmlAppend, charset);
      bottom = bottom ? Buffer.concat([bottom, htmlAppend]) : htmlAppend;
    }

    if (jsPrepend) {
      jsPrepend = wrapJs(jsPrepend, charset);
      top = top ? Buffer.concat([top, jsPrepend]) : jsPrepend;
    }
    if (jsBody) {
      jsBody = wrapJs(jsBody, charset);
      body = body ? Buffer.concat([body, jsBody]) : jsBody;
    }
    if (jsAppend) {
      jsAppend = wrapJs(jsAppend, charset);
      bottom = bottom ? Buffer.concat([bottom, jsAppend]) : jsAppend;
    }
    top = top && Buffer.concat([DOCTYPE, top]);
    break;
  case 'JS':
    top = jsPrepend;
    body - jsBody;
    bottom =  jsAppend;
    break;
  case 'CSS':
    top = cssPrepend;
    body = cssBody;
    bottom =  cssAppend;
    break;
  }

  if (top) {
    top = util.toBuffer(top, charset);
    data.top = data.top ? Buffer.concat([data.top, CRLF, top]) : Buffer.concat([CRLF, top]);
  }
  if (body) {
    body = util.toBuffer(body, charset);
    data.body = data.body ? Buffer.concat([data.body, CRLF, body]) : Buffer.concat([CRLF, body]);
  }
  if (bottom) {
    bottom = util.toBuffer(bottom, charset);
    data.bottom = data.bottom ? Buffer.concat([data.bottom, CRLF, bottom]) : Buffer.concat([CRLF, bottom]);
  }

  var hasData = data.body || data.top || data.bottom;
  if (hasData) {
    util.disableCSP(_res.headers);
    util.disableResStore(_res.headers);
  }

  if (!util.hasBody(_res)) {
    delete data.speed;
    delete data.body;
    delete data.top;
    delete data.bottom;
  }

  if (hasData || util.isWhistleTransformData(data)) {
    res.addZipTransform(new WhistleTransform(data));
  }

  if (util.hasBody(_res)) {
    handleReplace(res, replacement);
  }

//一定放在最后，确保能过滤到动态注入的内容
  if (speedTransform) {
    res.add(speedTransform);
  }

  util.drain(req, function() {
    util.getFileWriters([util.hasBody(_res) ? getWriterFile(util.getRuleFile(resRules.resWrite), _res.statusCode) : null,
getWriterFile(util.getRuleFile(resRules.resWriteRaw), _res.statusCode)], function(writer, rawWriter) {
      res.on('src', function(_res) {
        if (writer) {
          res.addZipTransform(new FileWriterTransform(writer, _res));
        }

        if (rawWriter) {
          res.addZipTransform(new FileWriterTransform(rawWriter, _res, true, req));
        }
      });
      var resHeaders = util.parseDeleteProperties(req).resHeaders;
      Object.keys(resHeaders).forEach(function(prop) {
        delete _res.headers[prop];
      });
      res.src(_res);
      util.disableResProps(req, _res.headers);
      if (properties.get('showHostIpInResHeaders') || req.filter.showHost || req.enable.showHost) {
        _res.headers['x-host-ip'] = req.hostIp || LOCALHOST;
      }
      var responseFor = util.getMatcherValue(resRules.responseFor);
      if (responseFor) {
        _res.headers['x-whistle-response-for'] = responseFor;
      }
      try {
        res.writeHead(_res.statusCode, formatHeaders(_res.headers, res.rawHeaderNames));
        _res.trailers && res.addTrailers(_res.trailers);
      } catch(e) {
        e._resError = true;
        util.emitError(res, e);
      }
    });
  });
}, !util.hasBody(_res));
  });
});

    });
  };

  var statusCode = util.getMatcherValue(resRules.statusCode);
  var resHeaders = {};
  if (!statusCode && resRules.redirect) {
    statusCode = 302;
    resHeaders.Connection = 'close';
    resHeaders.location = util.getMatcherValue(resRules.redirect);
  }

  if (statusCode) {
    req.hostIp = LOCALHOST;
    resHeaders.Connection = 'close';
    res.response(util.wrapResponse({
      statusCode: statusCode,
      headers: util.handleStatusCode(statusCode, resHeaders)
    }));
    return;
  }

  if (resRules.attachment || resRules.resReplace || resRules.resBody || resRules.resPrepend || resRules.resAppend
|| resRules.html || resRules.js || resRules.css || resRules.resWrite || resRules.resWriteRaw) {
    util.disableReqCache(req.headers);
  }

  next();
};
