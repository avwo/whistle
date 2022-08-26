var CodeMirror = require('codemirror');
var events = require('./events');
var protocols = require('./protocols');
var forwardRules = protocols.getForwardRules();
var pluginRules = protocols.getPluginRules();
var pluginNameList = protocols.getPluginNameList();
var DOT_PATTERN_RE = /^\.[\w-]+(?:[?$]|$)/;
var DOT_DOMAIN_RE = /^\.[^./?]+\.[^/?]/;
var IPV4_PORT_RE =
  /^(?:::(?:ffff:)?)?(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\:(\d+))?$/;
var FULL_IPV6_RE = /^[\da-f]{1,4}(?::[\da-f]{1,4}){7}$/;
var SHORT_IPV6_RE = /^[\da-f]{1,4}(?::[\da-f]{1,4}){0,6}$/;
var IP_WITH_PORT_RE = /^\[([:\da-f.]+)\](?::(\d+))?$/i;
var PLUGIN_VAR_RE = /^%([a-z\d_\-]+)[=.]/;

events.on('updatePlugins', function () {
  forwardRules = protocols.getForwardRules();
  pluginRules = protocols.getPluginRules();
  pluginNameList = protocols.getPluginNameList();
});

function notPort(port) {
  return port && (port == 0 || port > 65535);
}

CodeMirror.defineMode('rules', function () {
  function isIP(str) {
    var port;
    if (IP_WITH_PORT_RE.test(str)) {
      str = RegExp.$1;
      port = RegExp.$2;
      if (notPort(port)) {
        return false;
      }
    }
    if (IPV4_PORT_RE.test(str)) {
      return !port && notPort(RegExp.$1) ? false : true;
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
    return /^(?:resScript|resRules|responseFor|resCookies|resHeaders|trailers|replaceStatus|resDelay|resSpeed|resCors|resType|resCharset|cache|attachment|download|resBody|resPrepend|resAppend|css(?:Append|Prepend|Body)?|html(?:Append|Prepend|Body)?|js(?:Append|Prepend|Body)?|resReplace|resMerge|resWrite|resWriteRaw):\/\//.test(
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

  function isRegExp(str) {
    return /^\/[^/](.*)\/i?$/.test(str) || /^\$/.test(str);
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
    return /^cipher:\/\//.test(str);
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

  function isPortPattern(str) {
    return /^:\d{1,5}$/.test(str);
  }

  function isWildcard(str) {
    if (!/^(?:\$?(?:https?:|wss?:|tunnel:)?\/\/)?([^/?]+)/.test(str)) {
      return false;
    }
    var domain = RegExp.$1;
    return (
      domain.indexOf('*') !== -1 ||
      domain.indexOf('~') !== -1 ||
      DOT_DOMAIN_RE.test(domain)
    );
  }

  function isPluginVar(str) {
    return PLUGIN_VAR_RE.test(str) && RegExp.$1;
  }

  function isRegUrl(url) {
    return /^\^/.test(url) || DOT_PATTERN_RE.test(url);
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
          } else if (isStyle(str)) {
            type = 'atom js-style js-type';
          } else if (isPlugin(str)) {
            type = 'variable-2 js-plugin js-type';
          } else if (isHeaderReplace(str)) {
            type = 'variable-2 js-headerReplace js-type';
          } else if (isFilter(str)) {
            type = 'negative js-filter js-type';
          } else if (isLineProps(str)) {
            type = 'negative js-line-props js-type';
          } else if (isIgnore(str)) {
            type = 'negative js-ignore js-type';
          } else if (isEnable(str)) {
            type = 'atom js-enable js-type';
          } else if (isDisable(str)) {
            type = 'negative js-disable js-type';
          } else if (isCipher(str)) {
            type = 'atom js-cipher js-type';
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
            isHttpUrl = true;
            type =
              'string-2 js-url js-type' +
              (str[0] === 'h' ? ' js-http-url' : '');
          } else if (isWildcard(str)) {
            type = 'attribute js-attribute';
          } else if (isRule(str)) {
            type =
              'builtin js-rule js-type' +
              (notExistRule(str) ? ' error-rule' : '');
          }
        }
        pre = ch;
        return true;
      });
      if (!str) {
        return;
      }
      if (!type) {
        if (isRegExp(str) || isRegUrl(str) || isPortPattern(str)) {
          return 'attribute js-attribute';
        }
        var pluginName;
        if (/^@/.test(str)) {
          type = 'atom js-at js-type';
        } else if ((pluginName = isPluginVar(str))) {
          type = 'variable-2 js-plugin-var js-type';
          if (pluginNameList.indexOf(pluginName) === -1) {
            type += ' error-rule';
          }
        } else if (isWildcard(str)) {
          type = 'attribute js-attribute';
        } else if (isIP(str)) {
          type = 'number js-number';
        } else if (
          /^\{.*\}$/.test(str) ||
          /^<.*>$/.test(str) ||
          /^\(.*\)$/.test(str)
        ) {
          type = 'builtin js-rule js-type';
        } else if (isLocalPath(str)) {
          type = 'builtin js-rule js-type';
        }
      } else if (isHttpUrl && isWildcard(str)) {
        return 'attribute js-attribute';
      }
      return not ? type + ' error-rule' : type || 'js-http-url';
    }
  };
});
