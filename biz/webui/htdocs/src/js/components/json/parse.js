/*
    json_parse.js
    2016-05-02

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === "string") {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint for */

/*property
    at, b, call, charAt, f, fromCharCode, hasOwnProperty, message, n, name,
    prototype, push, r, t, text
*/

module.exports = (function () {
  // This is a function that can parse a JSON text, producing a JavaScript
  // data structure. It is a simple, recursive descent parser. It does not use
  // eval or regular expressions, so it can be used as a model for implementing
  // a JSON parser in other languages.

  // We are defining the function inside of another function to avoid creating
  // global variables.

  var at; // The index of the current character
  var ch; // The current character
  var escapee = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t'
  };
  var text;

  var error = function (m) {
    // Call error when something is wrong.

    throw {
      name: 'SyntaxError',
      message: m,
      at: at,
      text: text
    };
  };

  var next = function (c) {
    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at += 1;
    return ch;
  };

  var number = function () {
    // Parse a number value.

    var value;
    var string = '';

    if (ch === '-') {
      string = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      next();
    }
    if (ch === '.') {
      string += '.';
      while (next() && ch >= '0' && ch <= '9') {
        string += ch;
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      next();
      if (ch === '-' || ch === '+') {
        string += ch;
        next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
    }
    if (string.length > 15) {
      value = new String(string);
      value._$isNumber = true;
      return value;
    }
    value = +string;
    if (!isFinite(value)) {
      error('Bad number');
    } else {
      return value;
    }
  };

  var string = function () {
    // Parse a string value.

    var hex;
    var i;
    var value = '';
    var uffff;

    // When parsing for string values, we must look for " and \ characters.

    if (ch === '"') {
      while (next()) {
        if (ch === '"') {
          next();
          return value;
        }
        if (ch === '\\') {
          next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            value += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            value += escapee[ch];
          } else {
            break;
          }
        } else {
          value += ch;
        }
      }
    }
    error('Bad string');
  };

  var white = function () {
    // Skip whitespace.

    while (ch && ch <= ' ') {
      next();
    }
  };

  var word = function () {
    // true, false, or null.

    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;
    }
    error("Unexpected '" + ch + "'");
  };

  var value; // Place holder for the value function.

  var array = function () {
    // Parse an array value.

    var arr = [];

    if (ch === '[') {
      next('[');
      white();
      if (ch === ']') {
        next(']');
        return arr; // empty array
      }
      while (ch) {
        arr.push(value());
        white();
        if (ch === ']') {
          next(']');
          return arr;
        }
        next(',');
        white();
      }
    }
    error('Bad array');
  };

  var object = function () {
    // Parse an object value.

    var key;
    var obj = {};

    if (ch === '{') {
      next('{');
      white();
      if (ch === '}') {
        next('}');
        return obj; // empty object
      }
      while (ch) {
        key = string();
        white();
        next(':');
        if (Object.hasOwnProperty.call(obj, key)) {
          error("Duplicate key '" + key + "'");
        }
        obj[key] = value();
        white();
        if (ch === '}') {
          next('}');
          return obj;
        }
        next(',');
        white();
      }
    }
    error('Bad object');
  };

  value = function () {
    // Parse a JSON value. It could be an object, an array, a string, a number,
    // or a word.

    white();
    switch (ch) {
      case '{':
        return object();
      case '[':
        return array();
      case '"':
        return string();
      case '-':
        return number();
      default:
        return ch >= '0' && ch <= '9' ? number() : word();
    }
  };

  // Return the json_parse function. It will have access to all of the above
  // functions and variables.

  return function (source, reviver) {
    var result;

    text = source;
    at = 0;
    ch = ' ';
    result = value();
    white();
    if (ch) {
      error('Syntax error');
    }

    // If there is a reviver function, we recursively walk the new structure,
    // passing each name/value pair to the reviver function for possible
    // transformation, starting with a temporary root object that holds the result
    // in an empty key. If there is not a reviver function, we simply return the
    // result.

    return typeof reviver === 'function'
      ? (function walk(holder, key) {
          var k;
          var v;
          var val = holder[key];
          if (val && typeof val === 'object') {
            for (k in val) {
              if (Object.prototype.hasOwnProperty.call(val, k)) {
                v = walk(val, k);
                if (v !== undefined) {
                  val[k] = v;
                } else {
                  delete val[k];
                }
              }
            }
          }
          return reviver.call(holder, key, val);
        })({ '': result }, '')
      : result;
  };
})();
