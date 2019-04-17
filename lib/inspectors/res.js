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
var HTTPS_PROXY_RE = /^x?https-proxy:\/\//;
var INTERNAL_PROXY_RE = /^x?internal-proxy:\/\//;
var HS2H_PROXY_RE = /^x?https2http-proxy:\/\//;
var H2HS_PROXY_RE = /^x?http2https-proxy:\/\//;
var URL_RE = /^\s*((?:https?:)?\/\/\w[^\s]*)\s*$/i;
var X_RE = /^x/;

function wrapJs(js, charset) {
  if (!js) {
    return '';
  }
  if (URL_RE.test(js)) {
    return util.toBuffer('<script src="' + RegExp.$1 + '"></script>', charset);
  }
  return Buffer.concat([SCRIPT_START, util.toBuffer(js, charset), SCRIPT_END]);
}

function wrapCss(css, charset) {
  if (!css) {
    return '';
  }
  if (URL_RE.test(css)) {
    return util.toBuffer('<link rel="stylesheet" href="' + RegExp.$1 + '" />', charset);
  }
  return Buffer.concat([STYLE_START, util.toBuffer(css, charset), STYLE_END]);
}

function showDnsError(res, err) {
  res.response(util.wrapGatewayError('DNS Lookup Failed\r\n' + util.getErrorStack(err)));
}

function setCookies(headers, data) {
  var newCookies = data.headers['set-cookie'];
  if (newCookies) {
    var cookies = headers['set-cookie'];
    var isArray = Array.isArray(cookies);
    if (!isArray && cookies) {
      isArray = true;
      cookies = [String(cookies)];
    }
    if (isArray) {
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
    req.realUrl = res.realUrl = options.isPlugin ? req.fullUrl : options.href;
    var originPort = options.port;
    var now = Date.now();
    rules.getProxy(options.href, options.isPlugin ? null : req, function(err, hostIp, hostPort) {
      var proxyUrl = !options.isPlugin && resRules.proxy ? util.rule.getMatcher(resRules.proxy) : null;
      var headers = req.headers;
      var curUrl, auth;
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
      req.curUrl = curUrl;
      rules.resolveHost(req, function(err, ip, port, host) {
        var setHostsInfo = function(_ip, _port, _host, withPort) {
          ip = _ip || '127.0.0.1';
          port = _port;
          req.dnsTime = Date.now() - now;
          req.hostIp = util.getHostIp(_ip, withPort && _port );
          if (_host) {
            resRules.host = _host;
          }
        };
        setHostsInfo(hostIp || ip, hostPort || port, host);
        if (err) {
          showDnsError(res, err);
          return;
        }
        if (req.disable.keepalive) {
          req.disable.keepAlive = true;
        }
        var isHttps = options.protocol == 'https:';
        var proxyOptions, isProxyPort, isSocks, isHttpsProxy;
        var setAgent = function(disable) {
          if (disable || req.disable.keepAlive) {
            options.agent = false;
          } else {
            options.agent = isHttps ? config.httpsAgent : config.httpAgent;
          }
        };
        if (proxyUrl) {
          proxyOptions = url.parse(proxyUrl);
          proxyOptions.host = ip;
          if (SOCKS_PROXY_RE.test(proxyUrl)) {
            isSocks = true;
          } else {
            isHttpsProxy = HTTPS_PROXY_RE.test(proxyUrl);
          }
          if (!proxyOptions.port) {
            proxyOptions.port = isSocks ? 1080 : (isHttpsProxy ? 443 : 80);
          }
          if (proxyOptions.auth) {
            auth = 'Basic ' + util.toBuffer(proxyOptions.auth + '').toString('base64');
          }
          if (isHttps || isSocks || isHttpsProxy || req._phost) {
            isProxyPort = proxyOptions.port == config.port;
            if (isProxyPort && util.isLocalAddress(ip)) {
              if (req.setServerPort) {
                req.setServerPort(config.port);
              }
              res.response(util.wrapResponse({
                statusCode: 302,
                headers: {
                  location: 'http://' + ip + ':' + config.port + (options.path || '')
                }
              }));
            } else {
              var proxyHeaders = {
                host: options.hostname + ':' + (isHttps ? (options.port || 443) : 80),
                'proxy-connection': 'keep-alive'
              };
              if (auth) {
                proxyHeaders['proxy-authorization'] = auth;
              }
              if (!req.disable.proxyUA) {
                proxyHeaders['user-agent'] = config.PROXY_UA;
              }
              if (!util.isLocalAddress(req.clientIp)) {
                proxyHeaders[config.CLIENT_IP_HEAD] = req.clientIp;
              }
              if (isHttps) {
                util.checkIfAddInterceptPolicy(proxyHeaders, headers);
                if (isProxyPort) {
                  proxyHeaders[config.WEBUI_HEAD] = 1;
                }
              }
              util.setClientId(proxyHeaders, req.enable, req.disable, req.clientIp);
              var opts = {
                isHttps: isHttps,
                proxyServername: isHttpsProxy ? proxyOptions.hostname : null, 
                proxyHost: ip,
                clientIp: proxyHeaders[config.CLIENT_IP_HEAD],
                proxyPort: proxyOptions.port,
                url: options.href,
                auth: proxyOptions.auth,
                headers: proxyHeaders
              };
              var phost = req._phost;
              if (phost) {
                options.host = phost.hostname;
                if (phost.port > 0) {
                  options.port = phost.port;
                } else if (!options.port) {
                  options.port = isHttps ? 443 : 80;
                }
                proxyHeaders.host = options.host + ':' + options.port;
              } else {
                options.host = options.hostname;
              }
              options._proxyPort = opts.proxyPort;
              options.agent = isSocks ? config.getSocksAgent(opts) : config.getHttpsAgent(opts);
              request(options);
            }
            return;
          }

          if (auth) {
            headers['proxy-authorization'] = auth;
          }
        }

        req.hostIp = util.getHostIp(ip, port);
        port = proxyOptions ? proxyOptions.port : (port || options.port);
        options.host = ip;//设置ip
        isProxyPort = (port || (isHttps ? 443 : 80)) == config.port;
        const isLocalAddress = util.isLocalAddress(options.host);
        if (isProxyPort && isLocalAddress) {
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
          setAgent(isLocalAddress);
          request(options, port, true);
        }
        function request(options, serverPort, direct) {
          options.headers = headers;
          options.method = req.method;
          options.rejectUnauthorized = false;
          if (!options.isPlugin && !req._customHost && (req.fullUrl !== req.realUrl || !headers.host)) {
            headers.host = options.hostname;
            if (options.port && options.port != (isHttps ? 443 : 80)) {
              headers.host += ':' + options.port;
            }
          }
          if (req.disable.keepAlive) {
            headers.connection = 'close';
          }
          if (direct) {
            options.port = serverPort;
          }

          if (proxyUrl && direct) {
            options.path = options.href;
          }

          delete options.hostname; //防止自动dns
          delete options.protocol;
          if (isHttps) {
            options.servername = headers.host.split(':')[0];
          }
          var maxRetryCount = 1;
          var retryCount = 0;
          var retryXHost = 0;
          var resetCount = 0;
          var retry = function(err) {
            clearTimeout(timer);
            if (retryCount >= maxRetryCount) {
              var code = err && err.code;
              if (resetCount > 1 || code !== 'ECONNRESET' || req.method !== 'GET') {
                var stack = util.getErrorStack(err || new Error('socket connect timeout'));
                res.response(util.wrapGatewayError(stack));
              } else {
                ++resetCount;
                send();
              }
              return;
            }
            ++retryCount;
            if (proxyUrl) {
              if (X_RE.test(proxyUrl)) {
                proxyUrl = '';
                req.curUrl = req.realUrl;
                delete options._proxyPort;
                rules.resolveHost(req, function(_err, _ip, _port, _host) {
                  setAgent(util.isLocalAddress(_ip));
                  setHostsInfo(_ip, _port, _host, true);
                  if (_err) {
                    showDnsError(res, _err);
                    return;
                  }
                  options.host = ip;
                  options.port = _port || originPort;
                  ++maxRetryCount;
                  send();
                });
                return;
              }
            } else if (retryXHost < 2 && req.rules.host && X_RE.test(req.rules.host.matcher)) {
              ++maxRetryCount;
              ++retryXHost;
              if (retryXHost > 1) {
                req.curUrl = req.realUrl;
                delete options._proxyPort;
                rules.lookupHost(req, function(_err, _ip) {
                  setHostsInfo(_ip);
                  if (_err) {
                    showDnsError(res, _err);
                    return;
                  }
                  options.host = ip;
                  options.port = originPort;
                  send();
                });
                return;
              }
            } else if (isHttps && util.checkAuto2Http(req, ip)) {
              ++maxRetryCount;
              if (maxRetryCount > 2 || util.checkTlsError(err)) {
                isHttps = false;
                setAgent(util.isLocalAddress(options.host));
              }
            }
            send();
          };
          var send = function() {
            if (req.hasError) {
              return;
            }
            try {
              if (req.setServerPort) {
                req.setServerPort(options._proxyPort || options.port || (isHttps ? 443 : 80));
              }
              var client = (isHttps ? https : http).request(options, res.response);
              client.on('error', retry);
              client.once('socket', function(socket) {
                if (socket.connecting || socket._connecting) {
                  timer = setTimeout(function() {
                    socket.destroy();
                    timer = null;
                    retry();
                  }, 12000);
                  socket.once((proxyUrl || !isHttps) ? 'connect' : 'secureConnect', function() {
                    clearTimeout(timer);
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
          if (req.disable.clientIp || req.disable.clientIP) {
            delete headers[config.CLIENT_IP_HEAD];
          } else {
            var forwardedFor = util.getMatcherValue(resRules.forwardedFor);
            if (forwardedFor) {
              headers[config.CLIENT_IP_HEAD] = forwardedFor;
            } else if (!req._customXFF && !config.keepXFF && ((!options.isPlugin
                && (isHttps || isSocks || !proxyUrl)) || util.isLocalAddress(headers[config.CLIENT_IP_HEAD]))) {
              delete headers[config.CLIENT_IP_HEAD];
            }
          }

          Object.keys(deleteHeaders.reqHeaders).forEach(function(prop) {
            delete headers[prop];
          });
          var isDelete = options.method === 'DELETE' && options.headers['content-length'] == null;
          if (isDelete) {
            delete options.headers['transfer-encoding'];
          }
          proxyUrl ? util.setClientId(options.headers, req.enable, req.disable, req.clientIp) : util.removeClientId(options.headers);
          options.headers = formatHeaders(options.headers, req.rawHeaderNames);
          delete headers[config.WEBUI_HEAD];
          delete headers[config.HTTPS_FIELD];
          if (isDelete) {
            options.headers['Transfer-Encoding'] = 'chunked';
          }
          if (options.isPlugin) {
            options.headers[config.PLUGIN_HOOK_NAME_HEADER] = config.PLUGIN_HOOKS.HTTP;
          }
          send();
        }
      }, req.pluginRules, req.rulesFileMgr, req.headerRulesMgr);
    });
  };

  res.response = function(_res) {
    if (responsed) {
      return;
    }
    responsed = true;
    if (_res.realUrl) {
      req.realUrl = res.realUrl = _res.realUrl;
    }
    res.headers = req.resHeaders = _res.headers;
    res.trailers = _res.trailers;
    res._originEncoding = _res.headers['content-encoding'];
    req.statusCode = _res.statusCode;
    if (_res.rawHeaderNames) {
      res.rawHeaderNames = _res.rawHeaderNames;
    } else {
      res.rawHeaderNames = _res.rawHeaderNames = Array.isArray(_res.rawHeaders) ?
      getRawHeaderNames(_res.rawHeaders) : {};
    }
    util.drain(req, function() {
      pluginMgr.getResRules(req, _res, function() {
        var replaceStatus = util.getMatcherValue(resRules.replaceStatus)
          || util.getMatcherValue(resRules.statusCode);
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
        var ruleList = [resRules.resHeaders, resRules.resCookies, cors, resRules.resReplace, resRules.resMerge];
        util.parseRuleJson(ruleList, function(headers, cookies, cors, replacement, params) {
          var data = {};
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
          util.setResCors(data, resCors, cors, req.headers.origin, req.method === 'OPTIONS');

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
            util.setHeader(data, 'content-disposition', 'attachment; filename="' + util.encodeNonLatin1Char(attachment) + '"');
            util.disableReqCache(req.headers);
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
          var jsAppendUrl = util.getMatcherUrl(resRules.jsAppend);
          var cssAppendUrl = util.getMatcherUrl(resRules.cssAppend);
          var jsBodyUrl = util.getMatcherUrl(resRules.jsBody);
          var cssBodyUrl = util.getMatcherUrl(resRules.cssBody);
          var jsPrependUrl = util.getMatcherUrl(resRules.jsPrepend);
          var cssPrependUrl = util.getMatcherUrl(resRules.cssPrepend);

          util.readInjectFiles(data, function(data) {
            util.getRuleValue([resRules.resBody, resRules.resPrepend, resRules.resAppend,
            resRules.htmlAppend, jsAppendUrl ? null : resRules.jsAppend, cssAppendUrl ? null : resRules.cssAppend,
            resRules.htmlBody, jsBodyUrl ? null : resRules.jsBody, cssBodyUrl ? null : resRules.cssBody,
            resRules.htmlPrepend, jsPrependUrl ? null : resRules.jsPrepend, cssPrependUrl ? null : resRules.cssPrepend],
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
              if (data.charset && typeof data.charset == 'string') {
                type = headers['content-type'];
                type = typeof type == 'string' ? type.trim().split(';')[0] : '';
                type = type || mime.lookup(req.fullUrl.replace(/[?#].*$/, ''), 'text/html');
                headers['content-type'] = type + '; charset=' + data.charset;
              } else {
                delete data.charset;
              }
              if (!headers.pragma) {
                delete headers.pragma;
              }

              if (headers.location) {
                //nodejs的url只支持ascii，对非ascii的字符要encodeURIComponent，否则传到浏览器是乱码
                headers.location = util.encodeNonLatin1Char(headers.location);
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
                      if ((isHtml && !LIKE_JSON_RE.test(ctn)) || Buffer.byteLength(ctn) > MAX_RES_SIZE) {
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
                top = wrapCss(cssPrepend || cssPrependUrl, charset);
                body = wrapCss(cssBody || cssBodyUrl, charset);
                bottom = wrapCss(cssAppend || cssAppendUrl, charset);

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

                jsAppend = jsAppend || jsAppendUrl;
                jsBody = jsBody || jsBodyUrl;
                jsPrepend = jsPrepend || jsPrependUrl;
                
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
                body = jsBody;
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
                data.top = data.top ? Buffer.concat([data.top, CRLF, top]) : Buffer.concat([top, CRLF]);
              }
              if (body) {
                body = util.toBuffer(body, charset);
                data.body = data.body ? Buffer.concat([data.body, CRLF, body]) : body;
              }
              if (bottom) {
                bottom = util.toBuffer(bottom, charset);
                data.bottom = data.bottom ? Buffer.concat([data.bottom, CRLF, bottom]) : Buffer.concat([CRLF, bottom]);
              }

              var hasData = data.body || data.top || data.bottom;
              if (hasData) {
                !req.enable.keepCSP && util.disableCSP(_res.headers);
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

              var bodyFile = util.hasBody(_res) ? getWriterFile(util.getRuleFile(resRules.resWrite), _res.statusCode) : null;
              var rawFile = getWriterFile(util.getRuleFile(resRules.resWriteRaw), _res.statusCode);
              util.getFileWriters([bodyFile, rawFile], function(writer, rawWriter) {
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
                var rawNames = res.rawHeaderNames || {};
                if (req.enable.gzip) {
                  rawNames['content-encoding'] = rawNames['content-encoding'] || 'Content-Encoding';
                  _res.headers['content-encoding'] = 'gzip';
                  delete _res.headers['content-length'];
                }
                util.disableResProps(req, _res.headers);
                if (properties.get('showHostIpInResHeaders') || req.filter.showHost || req.enable.showHost) {
                  _res.headers['x-host-ip'] = req.hostIp || LOCALHOST;
                }
                util.setResponseFor(resRules, _res.headers, req.headers, req.hostIp);
                try {
                  res.writeHead(_res.statusCode, formatHeaders(_res.headers, rawNames));
                  _res.trailers && res.addTrailers(_res.trailers);
                } catch(e) {
                  e._resError = true;
                  util.emitError(res, e);
                }
              });
            }, !util.hasBody(_res));
          });
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
  if (!req.hasError) {
    next();
  }
};
