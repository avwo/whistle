require('../css/online.css');
var $ = require('jquery'); //for bootstrap
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;

var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var DNSDialog = require('./dns-servers-dialog');
var storage = require('./storage');
var win = require('./win');
var message = require('./message');
var ShortcutsSettings = require('./shortcuts-settings');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');
var DismissBtn = require('./dismiss-btn');

var showSysErr = util.showSysErr;
var isFunc = util.isFunc;
var getQps = util.getQps;
var getSize = util.getSize;
var escape = util.escape;
var formatTime = util.formatTime;
var IPV6_ONLY_VAL = 4;
var dialog;
var curOrder;
var curVerbatim = -1;
var theme = 'light';
var mediaMatches = false;
var borderColor;
var setTheme = function() {
  var newTheme = isDarkMode() ? 'dark' : 'light';
  if (theme === newTheme) {
    return;
  }
  theme = newTheme;
  try {
    var doc = document.documentElement;
    if (doc.getAttribute('data-theme') !== theme) {
      doc.setAttribute('data-theme', theme);
    }
    var style = getComputedStyle(doc);
    borderColor = style.getPropertyValue('--c-border').trim();
  } catch (e) {}
};
var handleThemeChange = setTheme;

var appearanceMode = storage.get('appearanceMode');
if (['auto', 'dark', 'light'].indexOf(appearanceMode) === -1) {
  appearanceMode = 'auto';
}

function getTotal(cur, max) {
  return cur + ' (Total: ' + max + ')';
}

function getMax(cur, max) {
  return cur + ' (Max: ' + max + ')';
}

function isDarkMode() {
  return (mediaMatches && appearanceMode === 'auto') || appearanceMode === 'dark';
}

function setAppearanceMode(mode) {
  appearanceMode = mode;
  handleThemeChange();
}

function onDarkModeChange(cb) {
  var media;
  try {
    media = window.matchMedia('(prefers-color-scheme: dark)');
    mediaMatches = media.matches;
  } catch (e) {
    return;
  }
  if (media) {
    cb();
    if (isFunc(media.addEventListener)) {
      media.addEventListener('change', cb);
    } else if (isFunc(media.addListener)) {
      media.addListener(cb);
    }
  }
}

setAppearanceMode(appearanceMode);
onDarkModeChange(function(e) {
  mediaMatches = e ? e.matches : mediaMatches;
  handleThemeChange();
});

function updateFakeIframe(iframe) {
  try {
    var style = iframe.contentDocument.documentElement.style;
    if (style.colorScheme !== theme) {
      style.colorScheme = theme;
      style.setProperty('--c-border', borderColor);
    }
  } catch (e) {}
}

function updateIframeTheme(iframe) {
  if (iframe.getAttribute('data-type') === 'fake') {
    return updateFakeIframe(iframe);
  }
  try {
    var win = iframe.contentWindow;
    var doc = win && win.document.documentElement;
    if (!doc) {
      return;
    }
    var curTheme = doc.getAttribute('data-theme');
    if (theme !== curTheme) {
      doc.setAttribute('data-theme', theme);
      if (isFunc(win.onWhistleThemeChange)) {
        win.onWhistleThemeChange(theme);
      }
    }
  } catch (e) {}
}

dataCenter.handleIframeLoad = function(e) {
  updateIframeTheme(e.target);
};

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
      '<button type="button" class="close" data-dismiss="modal">&times;</button>' +
      '<div class="w-online-ctn"></div>' +
      '<div class="w-online-info">' +  proxyInfoList.join('') + '</div>' +
      '<h5 class="w-theme-option"><strong>Theme:</strong><select class="form-control"><option value="auto">Auto</option>' +
      '<option value="dark">Dark</option><option value="light">Light</option></select></h5>'+
      '<h5 class="w-dns-order-option"><strong>DNS Order:</strong><select class="form-control"></select></h5>' +
      '<p><a class="w-online-clear-dns">Clear DNS Cache</a></p>' +
      '<p><a class="w-online-dns">View Custom DNS Servers</a></p>' +
      '<a class="w-online-shortcuts-settings">Shortcuts Settings</a>' +
      '</div>' +
      '<div class="modal-footer">' + win.DISSMISS_BTN +
      '</div></div></div></div>'
    ).appendTo(document.body);
    var appearanceSelect = dialog.find('.w-theme-option select');
    appearanceSelect.on('change', function(e) {
      var val = e.target.value;
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
          showSysErr(xhr);
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
    handleThemeChange = function() {
      setTheme();
      var iframes = document.querySelectorAll('iframe');
      for (var i = 0; i < iframes.length; i++) {
        updateIframeTheme(iframes[i]);
      }
    };

    handleThemeChange();
    setInterval(handleThemeChange, 1600);
  },
  checkServerChanged: function (data) {
    data.mac = data.mac || '';
    var self = this;
    if (self.macAddr === undefined) {
      self.macAddr = data.mac;
      self.serverPort = data.port;
      self.version = data.version;
      self.baseDir = data.baseDir;
      self.networkMode = data.networkMode;
      self.pluginsMode = data.pluginsMode;
      self.rulesMode = data.rulesMode;
      self.multiEnv = data.multiEnv;
      self.rulesOnlyMode = data.rulesOnlyMode;
    } else if (
      self.version !== data.version ||
      self.baseDir !== data.baseDir ||
      self.rulesOnlyMode !== data.rulesOnlyMode ||
      self.networkMode !== data.networkMode ||
      self.pluginsMode !== data.pluginsMode ||
      self.rulesMode !== data.rulesMode ||
      self.multiEnv !== data.multiEnv
    ) {
      self.refs.confirmReload.show();
    } else {
      self.refs.confirmReload.hide();
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
    self.state.server = server;
    var info = [];
    var whistleId = escape(server.whistleId);
    var username = escape(server.username);
    if (whistleId) {
      info.push('<h5 class="w-whistle-id-option" title="' + whistleId + '"><strong>Whistle ID:</strong> ' + whistleId + '</h5>');
    }
    if (username) {
      info.push('<h5 class="w-system-host"><strong>Username:</strong> ' + username + '</h5>');
    }
    var addInfo = function(name, value, prefix) {
      if (value) {
        info.push('<h5><strong>' + name + ':</strong> ' + (prefix || '') + value + '</h5>');
      }
    };
    addInfo('Host', escape(server.host));
    addInfo('PID', server.pid);
    addInfo('Node', server.nodeVersion);
    addInfo('Client', self.props.clientVersion, 'v');
    addInfo('Whistle', server.version, 'v');

    var port = server.realPort || server.port;
    if (port) {
      var bip = server.realHost != null ? server.realHost : server.bip;
      if (util.isStr(bip) && bip.indexOf(':') !== -1) {
        bip = '[' + bip + ']';
      }
      addInfo('Port', bip ? bip + ':' + port : port);
    }
    addInfo('SOCKS Port', server.socksPort);
    addInfo('HTTP Port', server.httpPort);
    addInfo('HTTPS Port', server.httpsPort);
    if (server.ipv4.length) {
      info.push('<h5><strong>IPv4:</strong></h5>');
      info.push('<p>' + server.ipv4.join('<br/>') + '</p>');
    }
    if (server.ipv6.length) {
      info.push('<h5><strong>IPv6:</strong></h5>');
      info.push('<p>' + server.ipv6.join('<br/>') + '</p>');
    }
    createDialog();
    var ctn = dialog.find('.w-online-ctn').html(info.join(''));
    if (curVerbatim !== server.verbatim) {
      curVerbatim = server.verbatim;
      dialog.find('.w-dns-order-option select').html(getDnsOrder(server.verbatim));
    }
    !self._pendingDnsOrder && selectDnsOption(server.dnsOrder);
    ctn.find('h5.w-system-host').attr('title', server.host);
    if (!self._initProxyInfo) {
      self._initProxyInfo = true;
      var curServerInfo;
      var isHide = true;
      var dnsElem = dialog.find('.w-online-dns');
      var shortcutsElem = dialog.find('.w-online-shortcuts-settings');
      var hideDns = true;

      dnsElem.on('click', function () {
        self.refs.dnsDialog.show(dataCenter.getServerInfo());
      });
      dialog.find('.w-online-clear-dns').on('click', function() {
        win.confirm('Do you confirm clearing the DNS cache?', function(sure) {
          if (sure) {
            dataCenter.rules.clearDnsCache(function (data, xhr) {
              if (!data) {
                showSysErr(xhr);
                return;
              }
              message.success('DNS cache cleared successfully');
            });
          }
        });
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
            dialog.find('.w-online-info').hide();
          }
          return;
        }
        if (isHide) {
          isHide = false;
          dialog.find('.w-online-info').show();
        }
        var reqElem = dialog.find('#whistleRequests');
        var uiReqElem = dialog.find('#whistleAllRequests');
        var cpuElem = dialog.find('#whistleCpu');
        var memElem = dialog.find('#whistleMemory');
        var uptimeElem = dialog.find('#whistleUptime');
        var qpsElem = dialog.find('#whistleQps');
        var uiQpsElem = dialog.find('#whistleAllQps');
        var memUsage = pInfo.memUsage;
        var totalTunnelRequests = pInfo.totalTunnelRequests;
        var tunnelRequests = pInfo.tunnelRequests;
        var totalWsRequests = pInfo.totalWsRequests;
        var httpRequests = pInfo.httpRequests;
        var totalHttpRequests = pInfo.totalHttpRequests;
        var allHttpRequests = pInfo.allHttpRequests;
        var totalAllHttpRequests = pInfo.totalAllHttpRequests;
        var allWsRequests = pInfo.allWsRequests;
        var totalAllWsRequests = pInfo.totalAllWsRequests;
        var cpuPercent = pInfo.cpuPercent;
        var tunnelReqs = '\nTUNNEL: ' + getTotal(tunnelRequests, totalTunnelRequests);
        var totalQps = pInfo.totalQps;
        var totalAllQps = pInfo.totalAllQps;
        var tunnelQps = pInfo.tunnelQps;
        uptimeElem.text(formatTime(pInfo.uptime));
        uptimeElem.parent().attr('title', pInfo.uptime);
        reqElem
          .parent()
          .attr(
            'title',
            'HTTP[S]: ' + getTotal(httpRequests, totalHttpRequests) +
            '\nWS[S]: ' + getTotal(pInfo.wsRequests, totalWsRequests) +
            tunnelReqs
          );
        uiReqElem
          .parent()
          .attr(
            'title',
            'HTTP[S]: ' + getTotal(allHttpRequests, totalAllHttpRequests) +
            '\nWS[S]: ' + getTotal(allWsRequests, totalAllWsRequests) +
            tunnelReqs
          );
        memElem.parent().attr(
          'title',
          Object.keys(memUsage)
            .map(function (key) {
              return key + ': ' + memUsage[key];
            })
            .join('\n')
        );
        qpsElem
          .parent()
          .attr(
            'title',
        [
          'HTTP[s]: ' + getQps(pInfo.httpQps),
          'WS[S]: ' + getQps(pInfo.wsQps),
          'TUNNEL: ' + getQps(tunnelQps)
        ].join('\n')
          );
        uiQpsElem
          .parent()
          .attr(
            'title',
        [
          'HTTP[s]: ' + getQps(pInfo.allHttpQps),
          'WS[S]: ' + getQps(pInfo.allWsQps),
          'TUNNEL: ' + getQps(tunnelQps)
        ].join('\n')
          );
        var totalCount = httpRequests + pInfo.wsRequests + tunnelRequests;
        var totalUICount = allHttpRequests + allWsRequests + tunnelRequests;
        var allCount = totalHttpRequests + totalWsRequests + totalTunnelRequests;
        var allUICount = totalAllHttpRequests + totalAllWsRequests +  totalTunnelRequests;
        var curPInfo = curServerInfo && curServerInfo.pInfo;
        pInfo.totalCount = totalCount;
        pInfo.allCount = allCount;
        pInfo.totalUICount = totalUICount;
        pInfo.allUICount = allUICount;
        if (!curPInfo) {
          reqElem.text(getTotal(totalCount, allCount));
          uiReqElem.text(getTotal(totalUICount, allUICount));
          cpuElem.text(getMax(cpuPercent, pInfo.maxCpu));
          memElem.text(getMax(getSize(memUsage.rss), getSize(pInfo.maxRss)));
          qpsElem.text(getMax(getQps(totalQps), getQps(pInfo.maxQps)));
          uiQpsElem.text(getMax(getQps(totalAllQps), getQps(pInfo.maxAllQps)));
        } else {
          if (memUsage.rss !== curPInfo.memUsage.rss) {
            memElem.text(getMax(getSize(memUsage.rss), getSize(pInfo.maxRss)));
          }
          if (
            totalCount !== curPInfo.totalCount ||
            allCount !== curPInfo.allCount
          ) {
            reqElem.text(getTotal(totalCount, allCount));
          }
          if (
            totalUICount !== curPInfo.totalUICount ||
            allUICount !== curPInfo.allUICount
          ) {
            uiReqElem.text(getTotal(totalUICount, allUICount));
          }
          if (cpuPercent !== curPInfo.cpuPercent) {
            cpuElem.text(getMax(cpuPercent, pInfo.maxCpu));
          }
          if (totalQps !== curPInfo.totalQps) {
            qpsElem.text(getMax(getQps(totalQps), getQps(pInfo.maxQps)));
          }
          if (totalAllQps !== curPInfo.totalAllQps) {
            uiQpsElem.text(getMax(getQps(totalAllQps), getQps(pInfo.maxAllQps)));
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
    var addInfo = function(name, value, prefix) {
      if (value) {
        info.push(name + ': ' + (prefix || '') + value);
      }
    };
    addInfo('Whistle ID', server.whistleId);
    addInfo('Username', server.username);
    addInfo('Host', server.host);
    addInfo('PID', server.pid);
    addInfo('Node', server.nodeVersion);
    addInfo('Client', this.props.clientVersion, 'v');
    addInfo('Whistle', server.version, 'v');
    addInfo('Port', server.realPort || server.port);
    addInfo('SOCKS Port', server.socksPort);
    addInfo('HTTP Port', server.httpPort);
    addInfo('HTTPS Port', server.httpsPort);

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
      var tunnelRequests = pInfo.tunnelRequests;
      var totalTunnelRequests = pInfo.totalTunnelRequests;
      addInfo('Uptime', formatTime(pInfo.uptime));
      addInfo(
        'All Requests', getTotal(pInfo.allHttpRequests + pInfo.allWsRequests + tunnelRequests,
          pInfo.totalAllHttpRequests + pInfo.totalAllWsRequests + totalTunnelRequests)
      );
      addInfo('All QPS', getMax(getQps(pInfo.totalAllQps), getQps(pInfo.maxAllQps)));
      addInfo(
        'Requests', getTotal(pInfo.httpRequests + pInfo.wsRequests + tunnelRequests,
          pInfo.totalHttpRequests + pInfo.totalWsRequests +  totalTunnelRequests)
      );
      addInfo('QPS', getMax(getQps(pInfo.totalQps), getQps(pInfo.maxQps)));
      addInfo('CPU', getMax(pInfo.cpuPercent, pInfo.maxCpu));
      addInfo('Memory', getMax(getSize(pInfo.memUsage.rss), getSize(pInfo.maxRss)));
    }
    if (server.dns) {
      info.push('Use custom DNS servers');
    }
    return info.join('\n');
  },
  setTitle: function () {
    var self = this;
    var server = dataCenter.getServerInfo() || self.state.server;
    findDOMNode(self.refs.onlineMenu).title = self.getTitle(server) || '';
  },
  render: function () {
    var self = this;
    var server = self.state.server || '';
    return (
      <a
        ref="onlineMenu"
        draggable="false"
        onMouseEnter={self.setTitle}
        className={'w-online-menu w-online' + (server ? '' : ' w-offline')}
        onClick={self.showServerInfo}
      >
        <Icon name="stats" />
        {server ? 'Online' : 'Offline'}
        {server.dns ? (
          <span>{server.doh ? '(DoH)' : server.r6 ? '(IPv6)' : '(IPv4)'}</span>
        ) : (server.ipv6Only ? '(IPv6)' : null)}
        <Dialog
          ref="confirmReload"
          wstyle="w-confirm-reload-dialog w-confirm-reload-global"
        >
          <div className="modal-body w-confirm-reload">
            <CloseBtn />
            The proxy has been modified.
            <br />
            Do you want to reload this page?
          </div>
          <div className="modal-footer">
            <DismissBtn />
            <button
              type="button"
              className="btn btn-primary"
              onClick={self.reload}
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
