var CodeMirror = require('codemirror');
var events = require('./events');
var protocols = require('./protocols');
var forwardRules = protocols.getForwardRules();
var pluginRules = protocols.getPluginRules();

events.on('updatePlugins', function() {
  forwardRules = protocols.getForwardRules();
  pluginRules = protocols.getPluginRules();
});


CodeMirror.defineMode('rules', function() {
  function isIP(str) {
    return /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\:\d+)?$/.test(str)
      || /^[:\da-f]*:[\da-f]*:[\da-f]+$/i.test(str) || /^\[[:\da-f]*:[\da-f]*:[\da-f]+\](?::\d+)?$/i.test(str);
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
    return /^(?:referer|auth|ua|forwardedFor|reqCookies|reqDelay|reqSpeed|reqCors|reqHeaders|method|reqType|reqCharset|reqBody|reqPrepend|reqAppend|reqReplace|reqWrite|reqWriteRaw):\/\//.test(str);
  }

  function isRes(str) {
    return /^(?:resScript|responseFor|resCookies|resHeaders|statusCode|status|replaceStatus|redirect|resDelay|resSpeed|resCors|resType|resCharset|cache|attachment|download|resBody|resPrepend|resAppend|css(?:Append|Prepend|Body)?|html(?:Append|Prepend|Body)?|js(?:Append|Prepend|Body)?|resReplace|resMerge|resWrite|resWriteRaw):\/\//.test(str);
  }

  function isUrl(str) {
    return /^(?:https?|wss?|tunnel):\/\//i.test(str);
  }

  function isRule(str) {
    return /^[\w\.-]+:\/\//i.test(str);
  }

  function notExistRule(str) {
    str = str.substring(0, str.indexOf(':'));
    return forwardRules.indexOf(str) == -1;
  }

  function notExistPlugin(str) {
    str = str.substring(0, str.indexOf(':'));
    return pluginRules.indexOf(str) == -1;
  }

  function isRegExp(str) {
    return /^\/[^/](.*)\/i?$/.test(str) || /^\$/.test(str);
  }

  function isParams(str) {
    return /^(?:urlParams|params|reqMerge|urlReplace|pathReplace):\/\//.test(str);
  }

  function isLog(str) {
    return /^log:\/\//.test(str);
  }

  function isFilter(str) {
    return /^(?:excludeFilter|filter):\/\//.test(str);
  }

  function isPlugin(str) {
    return /^(?:plugin|whistle)\.[a-z\d_\-]+:\/\//.test(str) && !notExistPlugin(str);
  }

  function isRulesFile(str) {
    return /^(?:rules?(?:File|Script)|reqScript):\/\//.test(str);
  }

  function isDisable(str) {
    return /^disable:\/\//.test(str);
  }

  function isIgnore(str) {
    return /^ignore:\/\//.test(str);
  }

  function isEnable(str) {
    return /^(?:includeFilter|enable):\/\//.test(str);
  }

  function isDelete(str) {
    return /^delete:\/\//.test(str);
  }

  function isProxy(str) {
    return /^x?(?:proxy|https?-proxy|http2https-proxy|https2http-proxy|internal-proxy):\/\//.test(str);
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

  function isPortPattern(str) {
    return /^:\d{1,5}$/.test(str);
  }

  function isWildcard(str) {
    if (!/^(?:\$?(?:https?:|wss?:|tunnel:)?\/\/)?([^/]+)/.test(str)) {
      return false;
    }
    return RegExp.$1.indexOf('*') !== -1 || RegExp.$1.indexOf('~') !== -1;
  }

  function isRegUrl(url) {
    return /^\^/.test(url);
  }

  return {
    token: function(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      var ch = stream.next();
      if (ch == '#') {
        stream.eatWhile(function(ch) {
          return true;
        });
        return 'comment';
      }

      var not = ch === '!';
      var str = not ? stream.next() : ch;
      var type = '';
      var pre;
      stream.eatWhile(function(ch) {
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
            type = 'number js-number js-type';
          } else if (isHead(str)) {
            type = 'header js-head js-type';
          } else if (isWeinre(str)) {
            type = 'atom js-weinre js-type';
          } else if (isProxy(str)) {
            type = 'tag js-proxy js-type';
          } else if (isReq(str)) {
            type = 'variable-2 js-req js-type';
          } else if (isRes(str)) {
            type = 'positive js-res js-type';
          } else if (isParams(str)) {
            type = 'meta js-params js-type';
          } else if (isLog(str)) {
            type = 'atom js-log js-type';
          } else if (isPlugin(str)) {
            type = 'variable-2 js-plugin js-type';
          } else if (isFilter(str)) {
            type = 'negative js-filter js-type';
          } else if (isIgnore(str)) {
            type = 'negative js-ignore js-type';
          } else if (isEnable(str)) {
            type = 'atom js-enable js-type';
          } else if (isDisable(str)) {
            type = 'negative js-disable js-type';
          } else if (isDelete(str)) {
            type = 'negative js-delete js-type';
          } else if (isProxy(str)) {
            type = 'variable-2 js-proxy js-type';
          } else if (isSocks(str)) {
            type = 'variable-2 js-socks js-type';
          } else if (isPac(str)) {
            type = 'variable-2 js-pac js-type';
          } else if (isRulesFile(str)) {
            type = 'variable-2 js-rulesFile js-type';
          } else if (isUrl(str)) {
            type = 'string-2 js-url js-type' + (str[0] === 'h' ? ' js-http-url' : '');
          } else if (isWildcard(str)) {
            type = 'attribute js-attribute';
          } else if (isRule(str)) {
            type = 'builtin js-rule js-type' + (notExistRule(str) ? ' error-rule' : '');
          }
        }
        pre = ch;
        return true;
      });
      if (!type) {
        if (isRegExp(str) || isRegUrl(str) || isPortPattern(str)) {
          return 'attribute js-attribute';
        }
        if (/^@/.test(str)) {
          type = 'atom js-at js-type';
        } else if (isWildcard(str)) {
          type = 'attribute js-attribute';
        } else if (isIP(str)) {
          type = 'number js-number';
        } else if (/^\{.*\}$/.test(str) || /^<.*>$/.test(str) || /^\(.*\)$/.test(str)) {
          type = 'builtin js-rule js-type';
        } else if (isLocalPath(str)) {
          type = 'builtin js-rule js-type';
        }
      }
      return not ? type + ' error-rule' : (type || 'js-http-url');
    }
  };
});
