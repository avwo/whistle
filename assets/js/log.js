
;(function() {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return;
  }

  if (window._whistleConsole) {
    return;
  }
  var console = window.console = window.console || {};
  var wConsole = window._whistleConsole = {};
  var JSON = window.JSON || patchJSON();
  function patchJSON() {
    var JSON = {};
    var rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
      return n < 10
              ? '0' + n
              : n;
    }

    function this_value() {
      return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== 'function') {

      Date.prototype.toJSON = function () {

        return isFinite(this.valueOf())
                  ? this.getUTCFullYear() + '-' +
                          f(this.getUTCMonth() + 1) + '-' +
                          f(this.getUTCDate()) + 'T' +
                          f(this.getUTCHours()) + ':' +
                          f(this.getUTCMinutes()) + ':' +
                          f(this.getUTCSeconds()) + 'Z'
                  : null;
      };

      Boolean.prototype.toJSON = this_value;
      Number.prototype.toJSON = this_value;
      String.prototype.toJSON = this_value;
    }

    var gap,
      indent,
      meta,
      rep;


    function quote(string) {

      rx_escapable.lastIndex = 0;
      return rx_escapable.test(string)
              ? '"' + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string'
                      ? c
                      : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
              }) + '"'
              : '"' + string + '"';
    }


    function str(key, holder) {

      var i,
        k,
        v,
        length,
        mind = gap,
        partial,
        value = holder[key];

      if (value && typeof value === 'object' &&
                  typeof value.toJSON === 'function') {
        value = value.toJSON(key);
      }

      if (typeof rep === 'function') {
        value = rep.call(holder, key, value);
      }

      switch (typeof value) {
      case 'string':
        return quote(value);

      case 'number':

        return isFinite(value)
                  ? String(value)
                  : 'null';

      case 'boolean':
      case 'null':

        return String(value);

      case 'object':

        if (!value) {
          return 'null';
        }

        gap += indent;
        partial = [];

        if (Object.prototype.toString.apply(value) === '[object Array]') {

          length = value.length;
          for (i = 0; i < length; i += 1) {
            partial[i] = str(i, value) || 'null';
          }

          v = partial.length === 0
                      ? '[]'
                      : gap
                          ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                          : '[' + partial.join(',') + ']';
          gap = mind;
          return v;
        }

        if (rep && typeof rep === 'object') {
          length = rep.length;
          for (i = 0; i < length; i += 1) {
            if (typeof rep[i] === 'string') {
              k = rep[i];
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                                  gap
                                      ? ': '
                                      : ':'
                              ) + v);
              }
            }
          }
        } else {

          for (k in value) {
            if (Object.prototype.hasOwnProperty.call(value, k)) {
              v = str(k, value);
              if (v) {
                partial.push(quote(k) + (
                                  gap
                                      ? ': '
                                      : ':'
                              ) + v);
              }
            }
          }
        }

        v = partial.length === 0
                  ? '{}'
                  : gap
                      ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                      : '{' + partial.join(',') + '}';
        gap = mind;
        return v;
      }
    }

    if (typeof JSON.stringify !== 'function') {
      meta = {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '"': '\\"',
        '\\': '\\\\'
      };
      JSON.stringify = function (value, replacer, space) {

        var i;
        gap = '';
        indent = '';

        if (typeof space === 'number') {
          for (i = 0; i < space; i += 1) {
            indent += ' ';
          }

        } else if (typeof space === 'string') {
          indent = space;
        }

        rep = replacer;
        if (replacer && typeof replacer !== 'function' &&
                      (typeof replacer !== 'object' ||
                      typeof replacer.length !== 'number')) {
          throw new Error('JSON.stringify');
        }


        return str('', {'': value});
      };
    }

    return JSON;
  }

  function stringify(obj) {
    if (typeof obj === 'function') {
      return obj.toString();
    }

    if (obj instanceof Error) {
      var stack = obj.stack;
      if (stack && typeof stack === 'string') {
        if (obj.message && stack.indexOf(obj.message) === -1) {
          return 'Error: ' + obj.message + '\n' + stack;
        }
      }
      return 'Error: ' + obj.message;
    }

    return obj === undefined ? 'undefined' : obj;
  }

  var index = 0;
  var MAX_LEN = 1024 * 56;
  function addLog(level, text) {
    var img = new Image();
    var timer;
    if (index > 9999) {
      index = 0;
    }
    var logStr = encodeURIComponent(text && (text + ''));
    if (logStr.length > MAX_LEN) {
      logStr = logStr.substring(0, MAX_LEN);
      var percIndex = logStr.indexOf('%', MAX_LEN - 3);
      if (percIndex !== -1) {
        logStr = logStr.substring(0, percIndex);
      }
    }
    img.src ='$LOG_CGI?id=$LOG_ID&level=' + level + '&text=' + logStr
      + '&' + new Date().getTime() + '-' + ++index;
    var preventGC = function() {
      img.onload = img.onerror = null;
      clearTimeout(timer);
    };
    img.onload = img.onerror = preventGC;
    timer = setTimeout(preventGC, 3000);
    if (typeof window.onWhistleLogSend === 'function') {
      window.onWhistleLogSend(level, text);
    }
  }

  function getPageInfo() {
    return '\r\nPage Url: ' + location.href + '\r\nUser Agent: ' + navigator.userAgent;
  }

  function getErrorStack(error, message) {
    var stack = (error.stack || error.message) + '';
    message = message || error.message;
    if (typeof message === 'string') {
      var msg = message.substring(message.indexOf(':') + 1);
      if (stack.indexOf(msg) === -1) {
        stack = message + '\n' + stack;
      }
    }
    return stack + getPageInfo();
  }

  function arrayIndexOf(arr, value) {
    if (arr.indexOf) {
      return arr.indexOf(value);
    }
    for (var i = 0, len = arr.length; i < len; i++) {
      if (arr[i] === value) {
        return i;
      }
    }
    return -1;
  }

  function stringifyObj(obj) {
    try {
      return JSON.stringify(obj);
    } catch(e) {}
    try {
      var keyList = [];
      var valList = [];
      return JSON.stringify(obj, function(key, value) {
        if (value && typeof value === 'object') {
          var index = arrayIndexOf(valList, value);
          valList.push(value);
          keyList.push(key);
          if (index !== -1) {
            return '[Circular ' + keyList[index] + ']';
          }
        }
        return value;
      });
    } catch(e) {}
  }

  var levels = ['fatal', 'error', 'warn', 'info', 'debug', 'log'];
  var noop = function() {};
  var slice = Array.prototype.slice;
  for (var i = 0, len = levels.length; i < len; i++) {
    (function(level) {
      var fn = console[level] || noop;
      var pending;
      var wFn = wConsole[level] = function() {
        var result = slice.call(arguments);
        if (typeof window.onBeforeWhistleLogSend === 'function') {
          pending = true;
          try {
            window.onBeforeWhistleLogSend(result, level);
          } catch(e) {
            result.push('onBeforeWhistleLogSend' + stringify(e));
          } finally {
            pending = false;
          }
        }
        for (var i = 0, len = result.length; i < len; i++) {
          result[i] = stringify(result[i]);
        }
        if (!result.length) {
          result = ['undefined'];
        }
        result = stringifyObj(result);
        result && addLog(level, result);
      };
      if ($INTERCEPT_CONSOLE) {
        console[level] = function() {
          if (pending) {
            return;
          }
          pending = true;
          var weinreFn = console['_weinre_' + level];
          if (typeof weinreFn === 'function') {
            try {
              weinreFn.apply(this, arguments);
            } catch (e) {}
          }
          wFn.apply(null, arguments);
          try {
            fn.apply(this, arguments);
          } catch(e) {
            fn(arguments.length < 2 ? arguments[0] : slice.apply(arguments));
          } finally {
            pending = false;
          }
        };
      }
    })(levels[i]);
  }
  /*eslint no-console: "off"*/
  var onerror = function(message, filename, lineno, colno, error) {
    if (error) {
      wConsole.error(getErrorStack(error, message));
    } else {
      wConsole.error('Error: ' + message + '(' + filename
          + ':' + lineno + ':' + (colno || 0) + ')' + getPageInfo());
    }
  };
  var isWeinreConsole = function(curConsole) {
    if (curConsole === console || typeof curConsole.log !== 'function') {
      return;
    }
    return curConsole.log.toString().indexOf('this._generic(MessageLevel.Log,') !== -1;
  };
  var attachOnError = function() {
    if (window.onerror !== onerror) {
      window.onerror = onerror;
    }
    var curConsole = window.console;
    if (!curConsole) {
      window.console = console;
    } else if ($INTERCEPT_CONSOLE && isWeinreConsole(curConsole)) {
      for (var i = 0, len = levels.length; i < len; i++) {
        var level = levels[i];
        var fn = console[level];
        var curFn = curConsole[level];
        if (fn !== curFn) {
          console['_weinre_' + level] = curFn;
          curConsole[level] = fn;
        }
      }
    }
    setTimeout(attachOnError, 600);
  };
  attachOnError();
})();
