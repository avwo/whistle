var http = require('http');
var https = require('https');
var parseUrl = require('url').parse;
var net = require('net');
var path = require('path');
var StringDecoder = require('string_decoder').StringDecoder;
require('should');
require('should-http');
var fs = require('fs');
var startWhistle = require('../index');
var socks = require('socksv5');
var util = require('./util.test');
var config = require('./config.test');
var testList = fs.readdirSync(path.join(__dirname, './units')).map(function(name, i) {
  i === 59 && console.log(name)
  return require('./units/' + name);
});
var len = testList.length;
var _l = [];
for (var i = 59; i < 60; i++) {
  _l.push(testList[i]);
}
testList = _l;
var options = {
  key: fs.readFileSync(path.join(__dirname, 'certs/root.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs/root.crt'))
};
var count = 6;

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: config.wsPort });

wss.on('connection', function connection(ws) {
  var req = ws.upgradeReq;
  ws.on('message', function(msg) {
    ws.send(JSON.stringify({
      type: 'server',
      method: req.method,
      headers: req.headers,
      body: msg
    }, null, '\t'));
  });
});

http.createServer(function(req, res) {
  req.on('error', util.noop);
  res.on('error', util.noop);

  var body = '';
  var decoder = new StringDecoder('utf8');
  req.on('data', function(data) {
    body += decoder.write(data);
  });
  req.on('end', function() {
    body += decoder.end();
    res.end(JSON.stringify({
      type: 'server',
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: body
    }, null, '\t'));
  });
}).listen(config.serverPort, startTest);

https.createServer(options, function(req, res) {
  res.end(JSON.stringify({
    headers: req.headers,
    body: 'test'
  }));
}).listen(config.httpsPort, startTest);

startWhistle({
  port: config.port,
  storage: 'test_',
  rules: fs.readFileSync(path.join(__dirname, 'rules.txt'), {encoding: 'utf8'})
}, startTest);

var socksServer = socks.createServer(function(info, accept, deny) {
  var socket;
  if (info.dstPort === 443) {
    if (socket = accept(true)) {
      var client = net.connect({
        host: '127.0.0.1',
        port: 5566
      }, function() {
        socket.pipe(client).pipe(socket);
      });
    }
    return;
  }
  if (socket = accept(true)) {
    var body = JSON.stringify({
      port: config.socksPort
    });
    socket.end([
      'HTTP/1.1 200 OK',
      'Connection: close',
      'Content-Type: text/plain;charset=utf8',
      'Content-Length: ' + Buffer.byteLength(body),
      '',
      body
    ].join('\r\n'));
  }
});

var authSocksServer = socks.createServer(function(info, accept, deny) {
  var socket;
  if (info.dstPort === 443) {
    if (socket = accept(true)) {
      var client = net.connect({
        host: '127.0.0.1',
        port: 5566
      }, function() {
        socket.pipe(client).pipe(socket);
      });
    }
    return;
  }
  if (socket = accept(true)) {
    var body = JSON.stringify({
      port: config.authSocksPort
    });
    socket.end([
      'HTTP/1.1 200 OK',
      'Connection: close',
      'Content-Type: text/plain;charset=utf8',
      'Content-Length: ' + Buffer.byteLength(body),
      '',
      body
    ].join('\r\n'));
  }
});

socksServer.useAuth(socks.auth.None());
authSocksServer.useAuth(socks.auth.UserPassword(function(user, password, cb) {
  cb(user == 'test' && password == 'hello1234');
}));

socksServer.listen(config.socksPort, startTest);
authSocksServer.listen(config.authSocksPort, startTest);

/**
 * 不用处理异常
 */
var server = http.createServer(function(req, res) {
  var fullUrl = /^http:/.test(req.url) ? req.url : 'http://' + req.headers.host + req.url;
  var options = parseUrl(fullUrl);
  delete options.hostname;
  options.host = '127.0.0.1';
  options.method = req.method;
  options.headers = req.headers;
  var client = http.request(options, function(_res) {
    _res.pipe(res);
  });
  req.pipe(client);
});

server.on('connect', function(req, socket) {
  var tunnelUrl = 'tunnel://' + (/^[^:\/]+:\d+$/.test(req.url) ? req.url : req.headers.host);
  var options = parseUrl(tunnelUrl);
  var client = net.connect({
    host: '127.0.0.1',
    port: options.port || 443
  }, function() {
    socket.pipe(client).pipe(socket);
    socket.write('HTTP/1.1 200 Connection Established\r\nProxy-Agent: whistle/test\r\n\r\n');
  });
});

server.listen(config.proxyPort, startTest);

function startTest() {
  if (--count > 0) {
    return;
  }

  var done;
  function testAll() {
    if (done) {
      return;
    }
    done = true;
    testList.forEach(function(fn) {
      fn();
    });
  }

  (function getData() {
    util.request('http://local.whistlejs.com/cgi-bin/get-data', function() {
      testAll();
      setTimeout(getData, 5000);
    });
  })();
}



