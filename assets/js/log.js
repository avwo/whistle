;(function() {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return;
  }
	var console = window.console = window.console || {};
	if (console._whistleConsole) {
		return;
	}
	console._whistleConsole = true;
	var JSON = window.JSON || patchJSON();
	function patchJSON() {
	    var JSON = {};
		var rx_one = /^[\],:{}\s]*$/,
	        rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
	        rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
	        rx_four = /(?:^|:|,)(?:\s*\[)+/g,
	        rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
	        rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

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
		if (obj == null) {
			return '';
		}

		if (!obj) {
			return obj + '';
		}
		var type = typeof obj;
		if (type == 'string') {
			return obj;
		}

		if (obj instanceof Error) {
			return obj.stack || obj.message;
		}

		if (type == 'function') {
			return obj.toString();
		}

		return JSON.stringify(obj, null, '\t');
	}

  var index = 0;
	function addLog(level, text) {
		var img = new Image();
		var timer;
    if (index > 9999) {
      index = 0;
    }
		img.src ='$LOG_CGI?level=' + level + '&text=' + encodeURIComponent(text)
      + '&' + new Date().getTime() + '-' + ++index;
		var preventGC = function() {
			img.onload = img.onerror = null;
			clearTimeout(timer);
		};
		img.onload = img.onerror = preventGC;
		timer = setTimeout(preventGC, 3000);
	}

	var levels = ['fatal', 'error', 'warn', 'info', 'debug', 'log'];
	var noop = function() {};
	for (var i = 0, len = levels.length; i < len; i++) {
		var level = levels[i];
		var fn = console[level] || noop;
		(function(level) {
			console[level] = function() {
				var result = [];
				for (var i = 0, len = arguments.length; i < len; i++) {
					result[i] = stringify(arguments[i]);
				}
				addLog(level, result.join(' '));
				fn.apply(this, arguments);
			};
		})(level);
	}

	window.onerror = function(message, filename, lineno, colno, error) {
		var pageInfo = '\r\nPage Url: ' + location.href + '\r\nUser Agent: ' + navigator.userAgent;
		if (error) {
			console.error((error.stack || error.message) + pageInfo);
		} else {
			console.error('Error: ' + message + '(' + filename
					+ ':' + lineno + ':' + (colno || 0) + ')' + pageInfo);
		}
	};

})();
