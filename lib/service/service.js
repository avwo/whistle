var http = require('http');
var express = require('express');

var MAX_PORT = 65000;
var curPort = 60000;

function getServer(callback) {
  if (curPort > MAX_PORT) {
    curPort = 40000;
  }

  var server = http.createServer();
  var port = curPort++;
  var next = function() {
    getServer(callback);
  };
  server.on('error', next);
  server.listen(port, function() {
    server.removeListener('error', next);
    callback(server, port);
  });
}

module.exports = function(options, callback) {
  getServer(function(server, port) {
    callback(null, {
      impExpPort: port
    });
  });
};