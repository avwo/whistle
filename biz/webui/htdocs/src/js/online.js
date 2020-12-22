require('./base-css.js');
require('../css/online.css');
var $ = window.jQuery = require('jquery'); //for bootstrap
require('bootstrap/dist/js/bootstrap.js');
var React = require('react');

var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');

var dialog;

function createDialog() {
  if (!dialog) {
    var proxyInfoList = [
      '<h5><strong>Uptime:</strong> <span id="whistleUptime">-</span></h5>',
      '<h5><strong>Requests:</strong> <span id="whistleRequests">-</span></h5>',
      '<h5><strong>CPU:</strong> <span id="whistleCpu">-</span></h5>',
      '<h5><strong>Memory:</strong> <span id="whistleMemory">-</span></h5>'
    ];
    dialog = $('<div class="modal fade w-online-dialog">' +
          '<div class="modal-dialog">' +
            '<div class="modal-content">' +
              '<div class="modal-body">' +
              '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
                '<div class="w-online-dialog-ctn"></div>' +
                '<div class="w-online-dialog-info">' + proxyInfoList.join('') + '</div>' +
              '</div>' +
              '<div class="modal-footer">' +
                '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>').appendTo(document.body);
  }

  return dialog;
}

function addIndent(list) {
  return list.map(function(ip) {
    return '  ' + ip;
  });
}

var Online = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentWillMount: function() {
    var self = this;
    var online = true;
    var body = $(document.body);
    dataCenter.on('serverInfo', function(data) {
      self.updateServerInfo(data);
      data && self.checkServerChanged(data);
      var curState = !!data;
      if (curState !== online) {
        online = curState;
        if (online) {
          body.removeClass('w-offline-status');
        } else {
          body.addClass('w-offline-status');
        }
      }
      self.setState({server: data});
    });
  },
  checkServerChanged: function(data) {
    data.mac = data.mac || '';
    if (this.macAddr === undefined) {
      this.macAddr = data.mac;
      this.serverPort = data.port;
      this.version = data.version;
      this.baseDir = data.baseDir;
      this.networkMode = data.networkMode;
      this.pluginsMode = data.pluginsMode;
      this.rulesMode = data.rulesMode;
      this.multiEnv = data.multiEnv;
    } else if (this.version !== data.version || this.baseDir !== data.baseDir
      || this.networkMode !== data.networkMode || this.pluginsMode !== data.pluginsMode
      || this.rulesMode !== data.rulesMode || this.multiEnv !== data.multiEnv) {
      this.refs.confirmReload.show();
    } else {
      this.refs.confirmReload.hide();
    }
  },
  showServerInfo: function() {
    if (!this.state.server) {
      return;
    }
    this.updateServerInfo(this.state.server);
    dialog.modal('show');
  },
  updateServerInfo: function(server) {
    if (!server) {
      return;
    }
    var info = [];
    var username = util.escape(server.username);
    if (username) {
      info.push('<h5><strong>Username:</strong> ' + username + '</h5>');
    }
    var host = util.escape(server.host);
    if (host) {
      info.push('<h5><strong>Host:</strong> ' + host + '</h5>');
    }
    if (server.pid) {
      info.push('<h5><strong>PID:</strong> ' + server.pid + '</h5>');
    }
    if (server.nodeVersion) {
      info.push('<h5><strong>Node:</strong> ' + server.nodeVersion + '</h5>');
    }
    if (server.version) {
      info.push('<h5><strong>Whistle:</strong> v' + server.version + '</h5>');
    }
    var port = server.realPort || server.port;
    if (port) {
      info.push('<h5><strong>Port:</strong> ' + port + '</h5>');
    }
    if (server.socksPort) {
      info.push('<h5><strong>SOCKS Port:</strong> ' + server.socksPort + '</h5>');
    }
    if (server.httpPort) {
      info.push('<h5><strong>HTTP Port:</strong> ' + server.httpPort + '</h5>');
    }
    if (server.httpsPort) {
      info.push('<h5><strong>HTTPS Port:</strong> ' + server.httpsPort + '</h5>');
    }
    if (server.ipv4.length) {
      info.push('<h5><strong>IPv4:</strong></h5>');
      info.push('<p>' + server.ipv4.join('<br/>') + '</p>');
    }
    if (server.ipv6.length) {
      info.push('<h5><strong>IPv6:</strong></h5>');
      info.push('<p>' + server.ipv6.join('<br/>') + '</p>');
    }
    var ctn = createDialog().find('.w-online-dialog-ctn').html(info.join(''));
    ctn.find('h5:first').attr('title', server.host);
    if (!this._initProxyInfo) {
      this._initProxyInfo = true;
      var curServerInfo;
      var isHide = true;
      setInterval(function() {
        var info = dataCenter.getServerInfo();
        var pInfo = info && info.pInfo;
        if (!pInfo) {
          if (isHide) {
            isHide = true;
            dialog.find('.w-online-dialog-info').hide();
          }
          return;
        }
        if (isHide) {
          isHide = false;
          dialog.find('.w-online-dialog-info').show();
        }
        var reqElem = dialog.find('#whistleRequests');
        var cpuElem = dialog.find('#whistleCpu');
        var memElem = dialog.find('#whistleMemory');
        var uptimeElem = dialog.find('#whistleUptime');
        uptimeElem.text(util.formatTime(pInfo.uptime));
        uptimeElem.parent().attr('title', pInfo.uptime);
        reqElem.parent().attr('title', 'HTTP[S]: ' + info.http + '\nWS[S]: ' + info.ws + '\nTUNNEL: ' + info.tunnel);
        memElem.parent().attr('title', Object.keys(pInfo.memUsage).map(function(key) {
          return key + ': ' + pInfo.memUsage[key];
        }).join('\n'));
        if (!curServerInfo || !curServerInfo.pInfo) {
          reqElem.text(info.http + info.ws + info.tunnel);
          cpuElem.text(pInfo.cpuPercent);
          memElem.text(util.getSize(pInfo.memUsage.rss));
        } else {
          var curPInfo = curServerInfo.pInfo;
          if (pInfo.memUsage !== curPInfo.memUsage) {
            memElem.text(util.getSize(pInfo.memUsage.rss));
          }
          var totalCount = info.http + info.ws + info.tunnel;
          pInfo.totalCount = totalCount;
          if (totalCount !== curPInfo.totalCount) {
            reqElem.text(totalCount);
          }
          if (pInfo.cpuPercent !== curPInfo.cpuPercent) {
            cpuElem.text(pInfo.cpuPercent || '-');
          }
        }
        curServerInfo = info;
      }, 1000);
    }
  },
  reload: function() {
    location.reload();
  },
  render: function() {
    var info = [];
    var server = this.state.server;
    if (server) {
      if (server.host) {
        info.push('Host: ' + server.host);
      }
      if (server.pid) {
        info.push('PID: ' + server.pid);
      }
      var port = server.realPort || server.port;
      if (port) {
        info.push('Port: ' + port);
      }
      if (server.socksPort) {
        info.push('SOCKS Port: ' + server.socksPort);
      }
      if (server.httpPort) {
        info.push('HTTP Port: ' + server.httpPort);
      }
      if (server.httpsPort) {
        info.push('HTTPS Port: ' + server.httpsPort);
      }

      if (server.ipv4.length) {
        info.push('IPv4:');
        info.push.apply(info, addIndent(server.ipv4));
      }
      if (server.ipv6.length) {
        info.push('IPv6:');
        info.push.apply(info, addIndent(server.ipv6));
      }
      var pInfo = server.pInfo;
      if (pInfo) {
        info.push('Uptime: ' + util.formatTime(pInfo.uptime));
        info.push('Requests: ' + (server.http + server.ws + server.tunnel));
        pInfo.cpuPercent && info.push('CPU: ' + pInfo.cpuPercent);
        info.push('Memory: ' + util.getSize(pInfo.memUsage.rss));
      }
    }
    return (
        <a title={info.join('\n')} draggable="false"
          className={'w-online-menu w-online' + (server ? '' : ' w-offline')} onClick={this.showServerInfo}>
          <span className="glyphicon glyphicon-stats"></span>{server ? 'Online' : 'Offline'}
          <Dialog ref="confirmReload" wstyle="w-confirm-reload-dialog">
            <div className="modal-body w-confirm-reload">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              The proxy has been modified.
              <br/>Do you want to reload this page.
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-primary" onClick={this.reload}>Reload</button>
            </div>
          </Dialog>
        </a>
    );
  }
});

module.exports = Online;
