var https = require('https');
var http = require('http');
var net = require('net');
var url = require('url');
var mime = require('mime');
var extend = require('util')._extend;
var util = require('../util');
var properties = require('../rules/util').properties;
var WhistleTransform = util.WhistleTransform;
var SpeedTransform = util.SpeedTransform;
var ReplacePatternTransform = util.ReplacePatternTransform;
var ReplaceStringTransform = util.ReplaceStringTransform;
var FileWriterTransform = util.FileWriterTransform;
var rules = require('../rules');
var pluginMgr = require('../plugins');
var LOCALHOST = '127.0.0.1';
var SCRIPT_START = util.toBuffer('<script>');
var SCRIPT_END = util.toBuffer('</script>');
var STYLE_START = util.toBuffer('<style>');
var STYLE_END = util.toBuffer('</style>');
var REQ_HEADER_RE = /^req\.headers\.(.+)$/;
var RES_HEADER_RE = /^res\.headers\.(.+)$/;
var HEADER_RE = /^headers\.(.+)$/;

function getDeleteProperties(deleteRule) {
  var reqHeaders = {};
  var resHeaders = {};
  Object.keys(deleteRule).forEach(function(prop) {
    if (REQ_HEADER_RE.test(prop)) {
      reqHeaders[RegExp.$1] = 1;
    } else if (RES_HEADER_RE.test(prop)) {
      resHeaders[RegExp.$1] = 1;
    } else if (HEADER_RE.test(prop)) {
      reqHeaders[RegExp.$1] = 1;
      resHeaders[RegExp.$1] = 1;
    }
  });
  return {
    reqHeaders: reqHeaders,
    resHeaders: resHeaders
  };
}

function handleCookies(data, cookies) {
  var list = cookies && Object.keys(cookies);
  var curCookies = data.headers && data.headers['set-cookie'];
  if (!Array.isArray(curCookies)) {
    curCookies = curCookies ? [curCookies + ''] : [];
  }

  if (list && list.length) {
    var result = {};
    curCookies.forEach(function(cookie) {
      var index = cookie.indexOf('=');
      if (index == -1) {
        result[cookie] = null;
      } else {
        result[cookie.substring(0, index)] = cookie.substring(index + 1);
      }
    });

    list.forEach(function(name) {
      var cookie = cookies[name];
      name = util.encodeURIComponent(name);
      if (!cookie || typeof cookie != 'object') {
        result[name] = cookie ? util.encodeURIComponent(cookie) : cookie;
      } else {
        var attrs = [];
        var value = cookie.value;
        attrs.push(value ? util.encodeURIComponent(value) : (value == null ? '' : value));
        var maxAge = cookie.maxAge && parseInt(cookie.maxAge, 10);
        if (!Number.isNaN(maxAge)) {
          attrs.push('Expires=' + new Date(Date.now() + maxAge * 1000).toGMTString());
          attrs.push('Max-Age=' + maxAge);
        }
        cookie.secure && attrs.push('Secure');
        cookie.path && attrs.push('Path=' + cookie.path);
        cookie.domain && attrs.push('Domain=' + cookie.domain);
        cookie.httpOnly && attrs.push('HttpOnly');
        result[name] = attrs.join('; ');
      }
    });


    cookies = Object.keys(result).map(function(name) {
      var value = result[name];
      return name + (value == null ? '' : '=' + value);
    });
    util.setHeader(data, 'set-cookie', cookies);
  }
}

function handleCors(data, cors) {
  if (!cors) {
    return;
  }

  if (cors.origin !== undefined) {
    util.setHeader(data, 'access-control-allow-origin', cors.origin);
  }

  if (cors.methods !== undefined) {
    util.setHeader(data, 'access-control-allow-methods', cors.methods);
  }

  if (cors.headers !== undefined) {
    util.setHeader(data, 'access-control-expose-headers', cors.headers);
  }

  if (cors.credentials !== undefined) {
    util.setHeader(data, 'access-control-allow-credentials', cors.credentials);
  }

  if (cors.maxAge !== undefined) {
    util.setHeader(data, 'access-control-max-age', cors.maxAge);
  }
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

function removeDisableProps(req, headers) {
  var disable = req.disable;

  if (disable.cookie || disable.cookies || disable.resCookie || disable.resCookies) {
    delete headers['set-cookie'];
  }

  if (disable.cache) {
    headers['cache-control'] = 'no-cache';
    headers.expires = new Date(Date.now() -60000000).toGMTString();
    headers.pragma = 'no-cache';
  }

  disable.csp && util.disableCSP(headers);
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
  var deleteHeaders = getDeleteProperties(req['delete']);

  req.request = function(options) {
    options = options || req.options;
    req.realUrl = res.realUrl = options.href;

    var now = Date.now();
    rules.getProxy(options.href, options.isPlugin ? null : req, function(err, hostIp, hostPort) {
      var proxyUrl = !options.isPlugin && resRules.proxy ? resRules.proxy.matcher : null;
      var headers = req.headers;
      var curUrl;
      if (!hostIp) {
        if (options.localDNS && net.isIP(options.host)) {
          curUrl = options.host;
        } else if (proxyUrl) {
          var isInternalProxy = /^internal-proxy:\/\//.test(proxyUrl);
          if (isInternalProxy || /^https2http-proxy:\/\//.test(proxyUrl)) {
            if (isInternalProxy && options.protocol === 'https:') {
              headers[config.HTTPS_FIELD] = 1;
            }
            options.protocol = null;
          } else if (/^http2https-proxy:\/\//.test(proxyUrl)) {
            options.protocol = 'https:';
          }
          curUrl = 'http:' + util.removeProtocol(proxyUrl);
        } else {
          curUrl = options.href;
        }
      }
      rules.resolveHost(curUrl, function(err, ip, port, host) {
        ip = hostIp || ip;
        port = hostPort || port;
        req.dnsTime = Date.now() - now;
        req.hostIp = ip;

        if (host) {
          resRules.host = host;
        }

        if (err) {
          res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(err)));
          return;
        }

        var isHttps = options.protocol == 'https:';
        var proxyOptions, isProxyPort;
        if (proxyUrl) {
          proxyOptions = url.parse(proxyUrl);
          proxyOptions.host = ip;
          var isSocks = proxyOptions.protocol == 'socks:';
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
                'user-agent': headers['user-agent'] || 'whistle/' + config.version
              };
              if (isHttps && isProxyPort) {
                proxyHeaders[config.WEBUI_HEAD] = 1;
              }
              var opts = {
                isHttps: isHttps,
                host: ip,
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
          options.agent = req.disable.keepAlive ? false : (isHttps ? config.httpsAgent : config.httpAgent);
          request(options, port, true);
        }

        function request(options, port, isDirectReq) {
          options.headers = headers;
          options.method = req.method;
          options.rejectUnauthorized = false;
          if (!options.isPlugin) {
            headers.host = options.hostname + (options.port ? ':' + options.port : '');
          }

          if (isDirectReq) {
            options.port = port;
          }

          if (proxyUrl && isDirectReq) {
            options.path = options.href;
          }

          if (resRules.hostname) {
            headers.host = util.getMatcherValue(resRules.hostname);
          }
          delete options.hostname; //防止自动dns
          var _request = function() {
            try {
              var client = (isHttps ? https : http).request(options, res.response);
              clearTimeout(timer);
              if (!timer && !util.hasRequestBody(req)) {
                client.once('finish', function() {
                  timer = setTimeout(function() {
                    if (responsed) {
                      return;
                    }
                    client.abort();
                  }, config.responseTimeout);
                });
              }
              return req.pipe(client);
            } catch(e) {
              res.response(util.wrapGatewayError(util.getErrorStack(e)));
            }

            return req;
          };

          if (deleteHeaders) {
            Object.keys(deleteHeaders.reqHeaders).forEach(function(prop) {
              delete req.headers[prop];
            });
          }
          options.headers = util.formatHeaders(options.headers, req.rawHeaderNames);
          _request().on('error', function(err) {
            if (responsed) {
              return;
            }
            if (util.hasRequestBody(req)) {
              res.response(util.wrapGatewayError(util.getErrorStack(err)));
            } else {
              _request().on('error', function(err) {
                if (!responsed) {
                  _request().on('error', function(err) {
                    res.response(util.wrapGatewayError(util.getErrorStack(err)));
                  });
                }
              });
            }
          });
        }
      }, req.pluginRules, req.rulesFileMgr);
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
      util.getRawHeaderNames(_res.rawHeaders) : {};
    }
    pluginMgr.getResRules(req, _res, function(resRulesMgr) {
      util.mergeRules(req, resRulesMgr && resRulesMgr.resolveRules(req.fullUrl));
      var replaceStatus = util.getMatcherValue(resRules.replaceStatus);
      if (replaceStatus && replaceStatus != _res.statusCode) {
        res.statusCode = _res.statusCode = replaceStatus;
        util.handleStatusCode(replaceStatus, _res.headers);
      }
      if (req.disable['301'] && _res.statusCode == 301) {
        res.statusCode = _res.statusCode = 302;
      }

      var cors = resRules.resCors;
      var resCors = util.getMatcherValue(cors);
      if (resCors == 'use-credentials') {
        cors = null;
        resCors = 'enable';
      } else if (resCors == '*' || resCors == 'enable') {
        cors = null;
      } else {
        resCors = null;
      }

      util.parseRuleJson([resRules.res, resRules.resHeaders, resRules.resCookies, cors, resRules.resReplace],
function(data, headers, cookies, cors, replacement) {
  if (resRules.head && resRules.head.res) {
    data = extend(resRules.head.res, data);
  }

  data = data || {};

  if (headers) {
    data.headers = extend(data.headers || {}, headers);
  }

  if (data.headers) {
    data.headers = util.lowerCaseify(data.headers, res.rawHeaderNames);
  }

  handleCookies(data, cookies);

  if (resCors == '*') {
    util.setHeader(data, 'access-control-allow-origin', '*');
  } else if (resCors == 'enable') {
    var origin = req.headers.origin;
    util.setHeaders(data, {
      'access-control-allow-credentials': !!origin,
      'access-control-allow-origin': origin || '*'
    });
  } else {
    handleCors(data, cors);
  }

  var cache = util.getMatcherValue(resRules.cache);
  var maxAge = parseInt(cache, 10);
  var noCache = /^(?:no|no-cache|no-store)$/i.test(cache) || maxAge < 0;
  if (maxAge > 0 || noCache) {
    util.setHeaders(data, {
      'cache-control': noCache ? (/^no-store$/i.test(cache) ? 'no-store' : 'no-cache') : 'max-age=' + maxAge,
      'expires': new Date(Date.now() + (noCache ? -60000000 : maxAge)).toGMTString(),
      'pragma': noCache ? 'no-cache' : ''
    });
  }

  if (resRules.attachment) {
    var attachment = util.getMatcherValue(resRules.attachment) || util.getFilename(req.fullUrl);
    util.setHeader(data, 'content-disposition', 'attachment; filename="' + attachment + '"');
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
    util.getRuleValue([resRules.resBody, resRules.resPrepend, resRules.resAppend, resRules.html, resRules.js, resRules.css],
function(resBody, resPrepend, resAppend, html, js, css) {
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

  if (typeof data.charset == 'string') {
    type = headers['content-type'];
    var charset = '; charset=' + data.charset;
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
  var bottom;
  switch(type) {
  case 'HTML':
    if (css) {
      bottom = Buffer.concat([STYLE_START, util.toBuffer(css), STYLE_END]);
    }

    if (html) {
      html = util.toBuffer(html);
      bottom = bottom ? Buffer.concat([bottom, html]) : html;
    }

    if (js) {
      js = Buffer.concat([SCRIPT_START, util.toBuffer(js), SCRIPT_END]);
      bottom = bottom ? Buffer.concat([bottom, js]) : js;
    }
    break;
  case 'JS':
    bottom =  js;
    break;
  case 'CSS':
    bottom =  css;
    break;
  }

  if (bottom) {
    bottom = util.toBuffer(bottom);
    data.bottom = data.bottom ? Buffer.concat([data.bottom, bottom]) : bottom;
  }

  if (!util.isEmptyObject(data)) {
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

      res.src(_res);
      removeDisableProps(req, _res.headers);
      if (properties.get('showHostIpInResHeaders')) {
        _res.headers['x-host-ip'] = req.hostIp || LOCALHOST;
      }
      if (deleteHeaders) {
        Object.keys(deleteHeaders.resHeaders).forEach(function(prop) {
          delete _res.headers[prop];
        });
      }
      try {
        res.writeHead(_res.statusCode, util.formatHeaders(_res.headers, res.rawHeaderNames));
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
    resHeaders.location = util.getMatcherValue(resRules.redirect);
  }

  if (statusCode) {
    req.hostIp = LOCALHOST;
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
