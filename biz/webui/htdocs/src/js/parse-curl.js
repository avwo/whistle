
var STATES = {
  '-A': 'user-agent',
  '--user-agent': 'user-agent',
  '-H': 'headers',
  '--header': 'headers',
  '-d': 'data',
  '--data': 'data',
  '--data-ascii': 'data',
  '--data-raw': 'data',
  '--data-binary': 'data',
  '--data-urlencode': 'data',
  '-u': 'user',
  '--user': 'user',
  '-X': 'method',
  '--request': 'method',
  '-b': 'cookie',
  '--cookie': 'cookie'
};

var pattern =  /\s*(?:([^\s\\'"]+)|'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|(\\.?)|(\S))(\s|$)?/;

function split(str) {
  var words = [];
  var field = '';

  var parseMatch = function(match) {
    if (match[5] != null) {
      throw new Error('Unmatched quote');
    }
    var word = match[1];
    var sq = match[2];
    var dq = match[3];
    var escape = match[4];
    var separator = match[6];
    if (word) {
      field += word;
    } else {
      var addition = sq || dq || escape;
      if (addition) {
        field += addition;
      }
    }
    if (separator != null) {
      words.push(field);
      field = '';
    }
  };

  while (str.length > 0) {
    var match = str.match(pattern);
    if (match && match.index != null && match[0] != null) {
      parseMatch(match);
      str = str.slice(match.index + match[0].length);
    } else {
      str = '';
    }
  }
  if (field) {
    words.push(field);
  }
  return words;
}

function parseArgs(s) {
  return split(s).reduce(function(result, a){
    if (!a) {
      return result;
    }
    if (a.indexOf('-X')) {
      result.push(a);
    } else {
      result.push('-X');
      if ( a = a.substring(2)) {
        result.push(a);
      }
    }
    return result;
  }, []);
}

module.exports = function(s) {
  s = s.trim();
  if (s.indexOf('curl ')) {
    return;
  }
  var args = parseArgs(s);
  var result = { method: 'GET', headers: {} };
  var headers = result.headers;
  var state = '';

  args.forEach(function(arg){
    if (/^https?:\/\//.test(arg)) {
      result.url = arg;
      return;
    }
    if (arg === '--compressed') {
      headers['accept-encoding'] = headers['accept-encoding'] || 'deflate, gzip';
      return;
    }
    if ( arg === '-I' || arg === '--head') {
      result.method = 'HEAD';
      return;
    }
    if (STATES[arg]) {
      state = STATES[arg];
      return;
    }
    if (!state) {
      return;
    }
    switch (state) {
    case 'method':
      result.method = arg.toUpperCase();
      break;
    case 'user':
      try {
        headers['authorization'] = 'Basic ' + btoa(arg);
      } catch (e) {}
      break;
    case 'user-agent':
      headers['user-agent'] = arg;
      break;
    case 'cookie':
      headers.cookie = arg;
      break;
    case 'headers':
      var index = arg.indexOf(': ');
      if (index !== -1) {
        var name = arg.substring(0, index).trim().toLowerCase();
        headers[name] = arg.substring(index + 2).trim();
      }
      break;
    case 'data':
      if (result.method == 'GET' || result.method == 'HEAD') {
        result.method = 'POST';
      }
      headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';
      result.body = result.body ? result.body + '&' + arg : arg;
      break;
    }
    state = '';
  });
  return result;
};
