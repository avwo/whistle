var CodeMirror = require('codemirror');
var protocols = require('./protocols');
var util = require('./util');

var forwardRules = protocols.getForwardRules();
var pluginRules = protocols.getPluginRules();
var IPV4_PORT_RE =
  /^(?:::(?:ffff:)?)?(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\:(\d+))?$/;
var FULL_IPV6_RE = /^[\da-f]{1,4}(?::[\da-f]{1,4}){7}$/;
var SHORT_IPV6_RE = /^[\da-f]{1,4}(?::[\da-f]{1,4}){0,6}$/;
var IP_WITH_PORT_RE = /^\[([:\da-f.]+)\](?::(\d+))?$/i;
var PLUGIN_VAR_RE = /^%[a-z\d_\-]+[=.]/;
var isWildcard = util.isWildcard;
var JS_TYPE = ' js-type';
var JS_ATTR = 'attribute js-attribute';
var BUILTIN_RULE = 'builtin js-rule' + JS_TYPE;

util.on('updatePlugins', function () {
  forwardRules = protocols.getForwardRules();
  pluginRules = protocols.getPluginRules();
});

function notPort(port) {
  return port && (port == 0 || port > 65535);
}

CodeMirror.defineMode('rules', function () {
  function isIP(str) {
    var port;
    var match = IP_WITH_PORT_RE.exec(str);
    if (match) {
      str = match[1];
      port = match[2];
      if (notPort(port)) {
        return false;
      }
    }
    if (match = IPV4_PORT_RE.exec(str)) {
      return port || !notPort(match[1]);
    }
    var index = str.indexOf('::');
    if (index !== -1) {
      if (str === '::' || str.indexOf('::', index + 1) !== -1) {
        return false;
      }
      str = str.split('::', 2);
      str = str[0] && str[1] ? str.join(':') : str[0] || str[1];
      return SHORT_IPV6_RE.test(str);
    }
    return FULL_IPV6_RE.test(str);
  }
  function isHost(str) {
    return /^x?hosts?:\/\//.test(str);
  }
  function isHead(str) {
    return /^head:\/\//.test(str);
  }

  function isWeinre(str) {
    return /^weinre:\/\//.test(str);
  }

  function isReq(str) {
    return /^(?:referer|auth|ua|forwardedFor|reqCookies|reqDelay|reqSpeed|reqCors|reqHeaders|method|reqType|reqCharset|reqBody|reqPrepend|reqAppend|reqReplace|reqWrite|reqWriteRaw):\/\//.test(
      str
    );
  }

  function isRes(str) {
    return /^(?:resScript|frameScript|resRules|responseFor|resCookies|resHeaders|trailers|replaceStatus|resDelay|resSpeed|resCors|resType|resCharset|cache|attachment|download|resBody|resPrepend|resAppend|css(?:Append|Prepend|Body)?|html(?:Append|Prepend|Body)?|js(?:Append|Prepend|Body)?|resReplace|resMerge|resWrite|resWriteRaw):\/\//.test(
      str
    );
  }

  function isUrl(str) {
    return /^(?:https?|wss?|tunnel):\/\//i.test(str);
  }

  function isRule(str) {
    return /^[\w\.-]+:\/\//i.test(str);
  }

  function notExistRule(str) {
    str = str.substring(0, str.indexOf(':'));
    return forwardRules.indexOf(str) == -1 && str !== 'status';
  }

  function notExistPlugin(str) {
    str = str.substring(0, str.indexOf(':'));
    return pluginRules.indexOf(str) == -1;
  }

  function isParams(str) {
    return /^(?:urlParams|params|reqMerge|urlReplace|pathReplace):\/\//.test(
      str
    );
  }

  function isLog(str) {
    return /^log:\/\//.test(str);
  }

  function isStyle(str) {
    return /^style:\/\//.test(str);
  }

  function isFilter(str) {
    return /^(?:excludeFilter|filter):\/\//.test(str);
  }

  function isLineProps(str) {
    return /^lineProps:\/\//.test(str);
  }

  function isPlugin(str) {
    return (
      /^(?:pipe|sniCallback):\/\//.test(str) ||
      (/^(?:plugin|whistle)\.[a-z\d_\-]+:\/\//.test(str) &&
        !notExistPlugin(str))
    );
  }

  function isRulesFile(str) {
    return /^(?:rules?(?:File|Script)|reqScript|reqRules):\/\//.test(str);
  }

  function isDisable(str) {
    return /^disable:\/\//.test(str);
  }

  function isCipher(str) {
    return /^(?:cipher|tlsOptions):\/\//.test(str);
  }

  function isIgnore(str) {
    return /^(?:ignore|skip):\/\//.test(str);
  }

  function isEnable(str) {
    return /^(?:includeFilter|enable):\/\//.test(str);
  }

  function isDelete(str) {
    return /^delete:\/\//.test(str);
  }

  function isHeaderReplace(str) {
    return /^headerReplace:\/\//.test(str);
  }

  function isProxy(str) {
    return /^x?(?:proxy|https?-proxy|http2https-proxy|https2http-proxy|internal-proxy|internal-https?-proxy):\/\//.test(
      str
    );
  }

  function isSocks(str) {
    return /^x?socks:\/\//.test(str);
  }

  function isPac(str) {
    return /^pac:\/\//.test(str);
  }

  function isLocalPath(str) {
    return /^[a-z]:(?:\\|\/(?!\/))/i.test(str) || /^\/[^/]/.test(str);
  }

  function isPluginVar(str) {
    return PLUGIN_VAR_RE.test(str);
  }

  return {
    token: function (stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      var ch = stream.next();
      if (ch == '#') {
        stream.eatWhile(function (ch) {
          return true;
        });
        return 'comment';
      }

      var not = ch === '!';
      var str = not ? stream.next() : ch;
      var type = '';
      var pre, isHttpUrl;
      stream.eatWhile(function (ch) {
        if (/\s/.test(ch) || ch == '#') {
          return false;
        }
        if (str === 'line' && ch === '`') {
          type = 'keyword js-keyword';
          return false;
        }
        str += ch;
        if (!type && ch == '/' && pre == '/') {
          if (isHost(str)) {
            type = 'number js-number' + JS_TYPE;
          } else if (isHead(str)) {
            type = 'header js-head' + JS_TYPE;
          } else if (isWeinre(str)) {
            type = 'atom js-weinre' + JS_TYPE;
          } else if (isProxy(str)) {
            type = 'tag js-proxy' + JS_TYPE;
          } else if (isReq(str)) {
            type = 'variable-2 js-req' + JS_TYPE;
          } else if (isRes(str)) {
            type = 'positive js-res' + JS_TYPE;
          } else if (isParams(str)) {
            type = 'meta js-params' + JS_TYPE;
          } else if (isLog(str)) {
            type = 'atom js-log' + JS_TYPE;
          } else if (isStyle(str)) {
            type = 'atom js-style' + JS_TYPE;
          } else if (isPlugin(str)) {
            type = 'variable-2 js-plugin' + JS_TYPE;
          } else if (isHeaderReplace(str)) {
            type = 'variable-2 js-headerReplace' + JS_TYPE;
          } else if (isFilter(str)) {
            type = 'negative js-filter' + JS_TYPE;
          } else if (isLineProps(str)) {
            type = 'negative js-line-props' + JS_TYPE;
          } else if (isIgnore(str)) {
            type = 'negative js-ignore' + JS_TYPE;
          } else if (isEnable(str)) {
            type = 'atom js-enable' + JS_TYPE;
          } else if (isDisable(str)) {
            type = 'negative js-disable' + JS_TYPE;
          } else if (isCipher(str)) {
            type = 'atom js-cipher js-tls-options' + JS_TYPE;
          } else if (isDelete(str)) {
            type = 'negative js-delete' + JS_TYPE;
          } else if (isProxy(str)) {
            type = 'variable-2 js-proxy' + JS_TYPE;
          } else if (isSocks(str)) {
            type = 'variable-2 js-socks' + JS_TYPE;
          } else if (isPac(str)) {
            type = 'variable-2 js-pac' + JS_TYPE;
          } else if (isRulesFile(str)) {
            type = 'variable-2 js-rulesFile' + JS_TYPE;
          } else if (isUrl(str)) {
            isHttpUrl = true;
            type =
              'string-2 js-url' + JS_TYPE +
              (str[0] === 'h' ? ' js-http-url' : '');
          } else if (isWildcard(str)) {
            type = JS_ATTR;
          } else if (isRule(str)) {
            type = BUILTIN_RULE + (notExistRule(str) ? ' error-rule' : '');
          }
        }
        pre = ch;
        return true;
      });
      if (!str) {
        return;
      }
      if (!type) {
        if (util.isSpecPattern(str)) {
          return JS_ATTR;
        }
        if (/^@/.test(str)) {
          type = 'atom js-at' + JS_TYPE;
        } else if (isPluginVar(str)) {
          type = 'variable-2 js-plugin-var' + JS_TYPE;
        } else if (isWildcard(str)) {
          type = JS_ATTR;
        } else if (isIP(str)) {
          type = 'number js-number';
        } else if (
          /^\{.*\}$/.test(str) ||
          /^<.*>$/.test(str) ||
          /^\(.*\)$/.test(str)
        ) {
          type = BUILTIN_RULE;
        } else if (isLocalPath(str)) {
          type = BUILTIN_RULE;
        }
      } else if (isHttpUrl && isWildcard(str)) {
        return JS_ATTR;
      }
      return not ? type + ' error-rule' : type || 'js-http-url';
    }
  };
});
