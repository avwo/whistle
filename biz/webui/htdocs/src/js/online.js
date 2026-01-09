require('../css/online.css');
var $ = require('jquery'); //for bootstrap
var React = require('react');
var ReactDOM = require('react-dom');

var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var DNSDialog = require('./dns-servers-dialog');
var storage = require('./storage');
var win = require('./win');
var message = require('./message');
var ShortcutsSettings = require('./shortcuts-settings');

var IPV6_ONLY_VAL = 4;
var dialog;
var curOrder;
var curVerbatim = -1;

var appearanceMode = storage.get('appearanceMode');
if (storage.get('disabledDarkMode') == '1') {
  appearanceMode = 'light';
} else if (['auto', 'dark', 'light'].indexOf(appearanceMode) === -1) {
  appearanceMode = 'auto';
}

function setAppearanceMode(mode) {
  appearanceMode = mode;
  var className = mode === 'light' ? '' : 'w-auto';
  if (mode === 'dark') {
    className += ' w-dark';
  }
  try {
    document.documentElement.className = className;
  } catch (e) {}
}
setAppearanceMode(appearanceMode);

function selectDnsOption(order) {
  order = +order;
  if (curVerbatim === 2) {
    if (order < 1 || order > IPV6_ONLY_VAL) {
      order = 1;
    }
  } else if (curVerbatim === 1) {
    if (order !== 2 && order !== IPV6_ONLY_VAL) {
      order = 1;
    }
  } else if (order !== IPV6_ONLY_VAL) {
    order = 0;
  }
  if (!dialog || curOrder === order) {
    return;
  }
  curOrder = order;
  dialog.find('.w-dns-order-option select').val(curOrder);
}

function getDnsOrder(verbatim) {
  var result = [];
  if (verbatim) {
    result.push(
      '<option value="1">Verbatim</option>',
      '<option value="2">IPv4-first</option>'
    );
    if (verbatim === 2) {
      result.push('<option value="3">IPv6-first</option>');
    }
  } else {
    result.push('<option value="0">Default</option>');
  }
  result.push('<option value="' + IPV6_ONLY_VAL + '">IPv6-only</option>');
  return result.join('');
}

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
      '<div class="w-online-dialog-info">' +  proxyInfoList.join('') + '</div>' +
      '<h5 class="w-appearance-option"><strong>Appearance:</strong><select class="form-control"><option value="auto">Auto</option>' +
      '<option value="dark">Dark</option><option value="light">Light</option></select></h5>'+
      '<h5 class="w-dns-order-option"><strong>DNS Order:</strong><select class="form-control"></select></h5>' +
      '<p><a class="w-online-view-dns">View Custom DNS Servers</a></p>' +
      '<a class="w-online-shortcuts-settings">Shortcuts Settings</a>' +
      '</div>' +
      '<div class="modal-footer">' +
      '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
      // '<button type="button" class="btn btn-primary w-login-btn" data-action="login">' +
      // '<span class="glyphicon glyphicon-log-in"></span><span class="w-login-label">Login</span></button>' +
      '</div></div></div></div>'
    ).appendTo(document.body);
    var appearanceSelect = dialog.find('.w-appearance-option select');
    appearanceSelect.on('change', function(e) {
      var val = e.target.value;
      storage.remove('disabledDarkMode');
      storage.set('appearanceMode', val);
      setAppearanceMode(val);
    });
    appearanceSelect.val(appearanceMode);
    dialog.find('.w-dns-order-option select').on('change', function(e) {
      var target = e.target;
      var order = +target.value;
      self._pendingDnsOrder = true;
      dataCenter.setDnsOrder({ order: order }, function (data, xhr) {
        setTimeout(function() {
          self._pendingDnsOrder = false;
        }, 300);
        if (!data) {
          util.showSystemError(xhr);
          return;
        }
        selectDnsOption(order);
      });
    });
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
  componentDidMount: function() {
    var self = this;
    dataCenter.setServerInfo = function(info) {
      !self._pendingDnsOrder && selectDnsOption(info.ipv6Only ? IPV6_ONLY_VAL : info.dnsOrder);
    };
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
    if (this.state.server) {
      this.updateServerInfo(dataCenter.getServerInfo());
      dialog.modal('show');
    }
  },
  updateServerInfo: function (server) {
    if (!server) {
      return;
    }
    var self = this;
    var clientVersion = self.props.clientVersion;
    self.state.server = server;
    var info = [];
    var whistleId = util.escape(server.whistleId);
    var username = util.escape(server.username);
    var host = util.escape(server.host);
    if (whistleId) {
      info.push('<h5 class="w-whistle-id-option" title="' + whistleId + '"><strong>Whistle ID:</strong> ' + whistleId + '</h5>');
    }
    if (username) {
      info.push('<h5 class="w-system-host"><strong>Username:</strong> ' + username + '</h5>');
    }
    if (host) {
      info.push('<h5><strong>Host:</strong> ' + host + '</h5>');
    }
    if (server.pid) {
      info.push('<h5><strong>PID:</strong> ' + server.pid + '</h5>');
    }
    if (server.nodeVersion) {
      info.push('<h5><strong>Node:</strong> ' + server.nodeVersion + '</h5>');
    }
    if (clientVersion) {
      info.push('<h5><strong>Client:</strong> v' + clientVersion + '</h5>');
    }
    if (server.version) {
      info.push('<h5><strong>Whistle:</strong> v' + server.version + '</h5>');
    }
    var port = server.realPort || server.port;
    if (port) {
      var bip = server.realHost != null ? server.realHost : server.bip;
      if (typeof bip === 'string' && bip.indexOf(':') !== -1) {
        bip = '[' + bip + ']';
      }
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
    createDialog();
    var ctn = dialog.find('.w-online-dialog-ctn').html(info.join(''));
    var loginBtn = dialog.find('.w-login-btn');
    var loginElem = loginBtn[0];
    if (loginElem) {
      var hasToken = dataCenter.hasWhistleToken;
      loginElem.className = 'btn w-login-btn  btn-' + (hasToken ? 'danger' : 'primary');
      loginBtn.attr('data-action', hasToken ? 'logout' : 'login');
      loginBtn.find('.w-login-label').text(hasToken ? 'Logout' : 'Login');
      loginBtn.find('.glyphicon')[0].className = 'glyphicon glyphicon-log-' + (hasToken ? 'out' : 'in');
    }
    if (curVerbatim !== server.verbatim) {
      curVerbatim = server.verbatim;
      dialog.find('.w-dns-order-option select').html(getDnsOrder(server.verbatim));
    }
    !self._pendingDnsOrder && selectDnsOption(server.dnsOrder);
    ctn.find('h5.w-system-host').attr('title', server.host);
    loginBtn.on('click', function (e) {
      var action = $(e.target).closest('button').attr('data-action');
      if (action === 'logout') {
        return win.confirm('Are you sure you want to log out?', function (sure) {
          if (!sure) {
            return;
          }
          dataCenter.logout(function (data, xhr) {
            if (!data) {
              return util.showSystemError(xhr);
            }
            if (data.ec !== 0) {
              return message.error(data.em || 'Logout failed');
            }
            message.success('Logged out successfully');
            dataCenter.triggerWhistleIdChanged();
          });
        });
      }
      util.showService('login');
    });
    if (!self._initProxyInfo) {
      self._initProxyInfo = true;
      var curServerInfo;
      var isHide = true;
      var dnsElem = dialog.find('.w-online-view-dns');
      var shortcutsElem = dialog.find('.w-online-shortcuts-settings');
      var hideDns = true;

      dnsElem.on('click', function () {
        self.refs.dnsDialog.show(dataCenter.getServerInfo());
      });
      shortcutsElem.on('click', function () {
        self.refs.shortcutsSettings.show();
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
    if (server.whistleId) {
      info.push('Whistle ID: ' + server.whistleId);
    }
    if (server.username) {
      info.push('Username: ' + server.username);
    }
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
    ReactDOM.findDOMNode(this.refs.onlineMenu).title = this.getTitle(server) || '';
  },
  render: function () {
    var server = this.state.server || '';
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
        {server.dns ? (
          <span>{server.doh ? '(DoH)' : server.r6 ? '(IPv6)' : '(IPv4)'}</span>
        ) : (server.ipv6Only ? '(IPv6)' : null)}
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
            Do you want to reload this page?
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
        <ShortcutsSettings ref="shortcutsSettings" />
      </a>
    );
  }
});

module.exports = Online;
