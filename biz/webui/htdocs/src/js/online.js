require('./base-css.js');
require('../css/online.css');
var $ = (window.jQuery = require('jquery')); //for bootstrap
require('bootstrap/dist/js/bootstrap.js');
var React = require('react');
var ReactDOM = require('react-dom');

var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var DNSDialog = require('./dns-servers-dialog');

var dialog;

function createDialog() {
  if (!dialog) {
    var proxyInfoList = [
      '<h5><strong>Uptime:</strong> <span id="whistleUptime">-</span></h5>',
      '<h5><strong>All Requests:</strong> <span id="whistleAllRequests">-</span></h5>',
      '<h5><strong>All QPS:</strong> <span id="whistleAllQps">-</span></h5>',
      '<h5><strong>Requests:</strong> <span id="whistleRequests">-</span></h5>',
      '<h5><strong>QPS:</strong> <span id="whistleQps">-</span></h5>',
      '<h5><strong>CPU:</strong> <span id="whistleCpu">-</span></h5>',
      '<h5><strong>Memory:</strong> <span id="whistleMemory">-</span></h5>'
    ];
    dialog = $(
      '<div class="modal fade w-online-dialog">' +
        '<div class="modal-dialog">' +
        '<div class="modal-content">' +
        '<div class="modal-body">' +
        '<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
        '<div class="w-online-dialog-ctn"></div>' +
        '<div class="w-online-dialog-info">' +
        proxyInfoList.join('') +
        '</div>' +
        '<a class="w-online-view-dns">View custom DNS servers</a>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>'
    ).appendTo(document.body);
  }

  return dialog;
}

function addIndent(list) {
  return list.map(function (ip) {
    return '  ' + ip;
  });
}

var Online = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentWillMount: function () {
    var self = this;
    var online = true;
    var body = $(document.body);
    dataCenter.on('serverInfo', function (data) {
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
      self.setState({ server: data });
    });
  },
  checkServerChanged: function (data) {
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
      this.rulesOnlyMode = data.rulesOnlyMode;
    } else if (
      this.version !== data.version ||
      this.baseDir !== data.baseDir ||
      this.rulesOnlyMode !== data.rulesOnlyMode ||
      this.networkMode !== data.networkMode ||
      this.pluginsMode !== data.pluginsMode ||
      this.rulesMode !== data.rulesMode ||
      this.multiEnv !== data.multiEnv
    ) {
      this.refs.confirmReload.show();
    } else {
      this.refs.confirmReload.hide();
    }
  },
  showServerInfo: function () {
    if (!this.state.server) {
      return;
    }
    this.updateServerInfo(this.state.server);
    dialog.modal('show');
  },
  updateServerInfo: function (server) {
    if (!server) {
      return;
    }
    this.state.server = server;
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
      var bip = server.realHost != null ? server.realHost : server.bip;
      info.push('<h5><strong>Port:</strong> ' + (bip ? bip + ':' + port : port) + '</h5>');
    }
    if (server.socksPort) {
      info.push(
        '<h5><strong>SOCKS Port:</strong> ' + server.socksPort + '</h5>'
      );
    }
    if (server.httpPort) {
      info.push('<h5><strong>HTTP Port:</strong> ' + server.httpPort + '</h5>');
    }
    if (server.httpsPort) {
      info.push(
        '<h5><strong>HTTPS Port:</strong> ' + server.httpsPort + '</h5>'
      );
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
      var dnsElem = dialog.find('.w-online-view-dns');
      var hideDns = true;
      var self = this;
      dnsElem.on('click', function () {
        self.refs.dnsDialog.show(dataCenter.getServerInfo());
      });
      var toggleDns = function (svrInfo) {
        if (svrInfo && svrInfo.dns) {
          if (hideDns) {
            hideDns = false;
            dnsElem.show();
          }
        } else {
          if (!hideDns) {
            hideDns = true;
            dnsElem.hide();
          }
        }
      };
      toggleDns(server);
      setInterval(function () {
        var info = dataCenter.getServerInfo();
        var pInfo = info && info.pInfo;
        toggleDns(info);
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
        var uiReqElem = dialog.find('#whistleAllRequests');
        var cpuElem = dialog.find('#whistleCpu');
        var memElem = dialog.find('#whistleMemory');
        var uptimeElem = dialog.find('#whistleUptime');
        var qpsElem = dialog.find('#whistleQps');
        var uiQpsElem = dialog.find('#whistleAllQps');
        uptimeElem.text(util.formatTime(pInfo.uptime));
        uptimeElem.parent().attr('title', pInfo.uptime);
        reqElem
          .parent()
          .attr(
            'title',
            'HTTP[S]: ' +
              pInfo.httpRequests +
              ' (Total: ' +
              pInfo.totalHttpRequests +
              ')' +
              '\nWS[S]: ' +
              pInfo.wsRequests +
              ' (Total: ' +
              pInfo.totalWsRequests +
              ')' +
              '\nTUNNEL: ' +
              pInfo.tunnelRequests +
              ' (Total: ' +
              pInfo.totalTunnelRequests +
              ')'
          );
        uiReqElem
          .parent()
          .attr(
            'title',
            'HTTP[S]: ' +
              pInfo.allHttpRequests +
              ' (Total: ' +
              pInfo.totalAllHttpRequests +
              ')' +
              '\nWS[S]: ' +
              pInfo.allWsRequests +
              ' (Total: ' +
              pInfo.totalAllWsRequests +
              ')' +
              '\nTUNNEL: ' +
              pInfo.tunnelRequests +
              ' (Total: ' +
              pInfo.totalTunnelRequests +
              ')'
          );
        memElem.parent().attr(
          'title',
          Object.keys(pInfo.memUsage)
            .map(function (key) {
              return key + ': ' + pInfo.memUsage[key];
            })
            .join('\n')
        );
        qpsElem
          .parent()
          .attr(
            'title',
        [
          'HTTP[s]: ' + util.getQps(pInfo.httpQps),
          'WS[S]: ' + util.getQps(pInfo.wsQps),
          'TUNNEL: ' + util.getQps(pInfo.tunnelQps)
        ].join('\n')
          );
        uiQpsElem
          .parent()
          .attr(
            'title',
        [
          'HTTP[s]: ' + util.getQps(pInfo.allHttpQps),
          'WS[S]: ' + util.getQps(pInfo.allWsQps),
          'TUNNEL: ' + util.getQps(pInfo.tunnelQps)
        ].join('\n')
          );
        var totalCount =
          pInfo.httpRequests + pInfo.wsRequests + pInfo.tunnelRequests;
        var totalUICount =
          pInfo.allHttpRequests + pInfo.allWsRequests + pInfo.tunnelRequests;
        var allCount =
          pInfo.totalHttpRequests +
          pInfo.totalWsRequests +
          pInfo.totalTunnelRequests;
        var allUICount =
          pInfo.totalAllHttpRequests +
          pInfo.totalAllWsRequests +
          pInfo.totalTunnelRequests;
        pInfo.totalCount = totalCount;
        pInfo.allCount = allCount;
        pInfo.totalUICount = totalUICount;
        pInfo.allUICount = allUICount;
        if (!curServerInfo || !curServerInfo.pInfo) {
          reqElem.text(totalCount + ' (Total: ' + allCount + ')');
          uiReqElem.text(totalUICount + ' (Total: ' + allUICount + ')');
          cpuElem.text(pInfo.cpuPercent + ' (Max: ' + pInfo.maxCpu + ')');
          memElem.text(
            util.getSize(pInfo.memUsage.rss) +
              ' (Max: ' +
              util.getSize(pInfo.maxRss) +
              ')'
          );
          qpsElem.text(
            util.getQps(pInfo.totalQps) +
              ' (Max: ' +
              util.getQps(pInfo.maxQps) +
              ')'
          );
          uiQpsElem.text(
            util.getQps(pInfo.totalAllQps) +
              ' (Max: ' +
              util.getQps(pInfo.maxAllQps) +
              ')'
          );
        } else {
          var curPInfo = curServerInfo.pInfo;
          if (pInfo.memUsage.rss !== curPInfo.memUsage.rss) {
            memElem.text(
              util.getSize(pInfo.memUsage.rss) +
                ' (Max: ' +
                util.getSize(pInfo.maxRss) +
                ')'
            );
          }
          if (
            totalCount !== curPInfo.totalCount ||
            allCount !== curPInfo.allCount
          ) {
            reqElem.text(totalCount + ' (Total: ' + allCount + ')');
          }
          if (
            totalUICount !== curPInfo.totalUICount ||
            allUICount !== curPInfo.allUICount
          ) {
            uiReqElem.text(totalUICount + ' (Total: ' + allUICount + ')');
          }
          if (pInfo.cpuPercent !== curPInfo.cpuPercent) {
            cpuElem.text(pInfo.cpuPercent + ' (Max: ' + pInfo.maxCpu + ')');
          }
          if (pInfo.totalQps !== curPInfo.totalQps) {
            qpsElem.text(
              util.getQps(pInfo.totalQps) +
                ' (Max: ' +
                util.getQps(pInfo.maxQps) +
                ')'
            );
          }
          if (pInfo.totalAllQps !== curPInfo.totalAllQps) {
            uiQpsElem.text(
              util.getQps(pInfo.totalAllQps) +
                ' (Max: ' +
                util.getQps(pInfo.maxAllQps) +
                ')'
            );
          }
        }
        curServerInfo = info;
      }, 1000);
    }
  },
  reload: function () {
    location.reload();
  },
  getTitle: function (server) {
    if (!server) {
      return;
    }
    var info = [];
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
      info.push(
        'All Requests: ' +
          (pInfo.allHttpRequests +
            pInfo.allWsRequests +
            pInfo.tunnelRequests +
            ' (Total: ' +
            (pInfo.totalAllHttpRequests +
              pInfo.totalAllWsRequests +
              pInfo.totalTunnelRequests) +
            ')')
      );
      info.push(
        'Requests: ' +
          (pInfo.httpRequests +
            pInfo.wsRequests +
            pInfo.tunnelRequests +
            ' (Total: ' +
            (pInfo.totalHttpRequests +
              pInfo.totalWsRequests +
              pInfo.totalTunnelRequests) +
            ')')
      );
      pInfo.cpuPercent && info.push('CPU: ' + pInfo.cpuPercent);
      info.push('Memory: ' + util.getSize(pInfo.memUsage.rss));
      info.push('QPS: ' + util.getQps(pInfo.totalQps));
      info.push('All QPS: ' + util.getQps(pInfo.totalAllQps));
    }
    if (server.dns) {
      info.push('Use custom DNS servers');
    }
    return info.join('\n');
  },
  setTitle: function () {
    var server = dataCenter.getServerInfo() || this.state.server;
    ReactDOM.findDOMNode(this.refs.onlineMenu).title = this.getTitle(server);
  },
  render: function () {
    var server = this.state.server;
    return (
      <a
        ref="onlineMenu"
        draggable="false"
        onMouseEnter={this.setTitle}
        className={'w-online-menu w-online' + (server ? '' : ' w-offline')}
        onClick={this.showServerInfo}
      >
        <span className="glyphicon glyphicon-stats"></span>
        {server ? 'Online' : 'Offline'}
        {server && server.dns ? (
          <span>{server.doh ? '(DOH)' : server.r6 ? '(IPv6)' : '(IPv4)'}</span>
        ) : null}
        <Dialog
          ref="confirmReload"
          wstyle="w-confirm-reload-dialog w-confirm-reload-global"
        >
          <div className="modal-body w-confirm-reload">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
            The proxy has been modified.
            <br />
            Do you want to reload this page.
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.reload}
            >
              Reload
            </button>
          </div>
        </Dialog>
        <DNSDialog ref="dnsDialog" />
      </a>
    );
  }
});

module.exports = Online;
