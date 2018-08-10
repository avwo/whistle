var http = require('http');

function getBody(options) {
  if (!options.body) {
    return;
  }
  if (typeof options.body === 'string') {
    return options.body;
  }
  try {
    return JSON.stringify(options.body);
  } catch(e) {}
}

module.exports = function(options, cb) {
  var done;
  var execCb = function(err, result) {
    if (!done) {
      done = true;
      cb(err, result);
    }
  };
  options.method = options.method || 'GET';
  var client = http.request(options, function(res) {
    if (res.statusCode !== 200) {
      return execCb(true);
    }
    var body;
    res.on('error', execCb);
    res.on('data', function(data) {
      body = body ? Buffer.concat([body, data]) : data;
    });
    res.once('end', function() {
      if (body) {
        try {
          return execCb(null, JSON.parse(String(body)));
        } catch(e) {
          return execCb(e);
        }
      }
      execCb(true);
    });
  });
  client.on('error', execCb);
  client.setTimeout(6000, function() {
    client.abort();
  });
  client.end(getBody(options));
};
