var ws = require('ws');
var util = require('util');
var http = require('http');
var https = require('https');

function WebSocket(address, protocols, options) {
  var httpReq = http.request;
  var httpsReq = https.request;
  http.request = function(opts) {
    httpReq.apply(this, arguments);
  };
  https.request = function(opts) {
    httpsReq.apply(this, arguments);
  };
  ws.apply(this, arguments);
  http.request = httpReq;
  https.request = httpsReq;
}

util.inherits(WebSocket, ws);

module.exports = WebSocket;
