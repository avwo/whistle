require('./base-css.js');
require('../css/overview.css');
var React = require('react');
var ReactDOM = require('react-dom');
var columns = require('./columns');
var events = require('./events');
var util = require('./util');
var storage = require('./storage');
var Properties = require('./properties');
var dataCenter = require('./data-center');
var getHelpUrl = require('./protocols').getHelpUrl;

var OVERVIEW = [
  'Url',
  'Final Url',
  'Method',
  'Http Version',
  'Status Code',
  'Status Message',
  'Client IP',
  'Client Port',
  'Client ID',
  'Server IP',
  'Server Port',
  'Request Body',
  'Response Body',
  'Content Encoding',
  'Start Date',
  'DNS Lookup',
  'Request Sent',
  'Response Headers',
  'Content Loaded',
  'Total'
];
var OVERVIEW_PROPS = [
  'url',
  'realUrl',
  'req.method',
  'req.httpVersion',
  'res.statusCode',
  'res.statusMessage',
  'req.ip',
  'req.port',
  'clientId',
  'res.ip',
  'res.port',
  'req.size',
  'res.size',
  'contentEncoding'
];
/**
 * statusCode://, redirect://[statusCode:]url, [req, res]speed://,
 * [req, res]delay://, method://, [req, res][content]Type://自动lookup,
 * cache://xxxs[no], params://json|string(放在url)
 */
var PROTOCOLS = require('./protocols').PROTOCOLS;
var DEFAULT_OVERVIEW_MODAL = {};
var DEFAULT_RULES_MODAL = {};
var PROXY_PROTOCOLS = ['socks', 'http-proxy', 'https-proxy'];

function getAtRule(rule) {
  return rule.rawPattern + ' @' + rule.matcher.substring(4);
}

function getVarRule(rule) {
  return rule.rawPattern + ' %' + rule.matcher.substring(4);
}

function getStr(str) {
  return str ? ' ' + str : '';
}

function filterImportant(item) {
  return item.indexOf('important') !== -1;
}

function getRawProps(rule, all) {
  rule = rule.rawProps;
  if (!rule) {
    return '';
  }
  if (!all) {
    rule = rule.filter(filterImportant);
  }
  return getStr(rule.join(' '));
}

function getRuleStr(rule) {
  if (!rule) {
    return;
  }
  var matcher = rule.matcher;
  if (rule.port) {
    var protoIndex = matcher.indexOf(':') + 3;
    var proto = matcher.substring(0, protoIndex);
    if (matcher.indexOf(':', protoIndex) !== -1) {
      matcher = proto + '[' + matcher.substring(protoIndex) + ']';
    }
    matcher = matcher + ':' + rule.port;
  }
  return rule.rawPattern + ' ' + matcher + getRawProps(rule, true) + getStr(rule.filter);
}

function getTime(time) {
  return time === '-' ? '' : time;
}

function ignoreProtocol(name) {
  return PROXY_PROTOCOLS.indexOf(name) !== -1 || name === 'skip' || /^x/.test(name);
}

OVERVIEW.forEach(function (name) {
  DEFAULT_OVERVIEW_MODAL[name] = '';
});
PROTOCOLS.forEach(function (name) {
  if (ignoreProtocol(name)) {
    return;
  }
  DEFAULT_RULES_MODAL[name] = '';
});

function formatSize(value) {
  return value >= 1024
    ? value + '(' + Number(value / 1024).toFixed(2) + 'k)'
    : value;
}

var Overview = React.createClass({
  getInitialState: function () {
    return {
      showOnlyMatchRules: storage.get('showOnlyMatchRules') == 1
    };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidMount: function () {
    var self = this;
    var container = ReactDOM.findDOMNode(self.refs.container);
    events.on('overviewScrollTop', function () {
      if (!util.getBoolean(self.props.hide)) {
        container.scrollTop = 0;
      }
    });
  },
  showOnlyMatchRules: function (e) {
    var showOnlyMatchRules = e.target.checked;
    storage.set('showOnlyMatchRules', showOnlyMatchRules ? 1 : 0);
    this.setState({
      showOnlyMatchRules: showOnlyMatchRules
    });
  },
  onHelp: function (e) {
    var name = e.target.getAttribute('data-name');
    var helpUrl = getHelpUrl(name);
    if (!helpUrl) {
      return;
    }
    window.open(name === 'rule' ? helpUrl + 'rule/' : helpUrl);
  },
  render: function () {
    var overviewModal = DEFAULT_OVERVIEW_MODAL;
    var rulesModal = DEFAULT_RULES_MODAL;
    var modal = this.props.modal;
    var showOnlyMatchRules = this.state.showOnlyMatchRules;
    var realUrl, hasPluginRule;

    if (modal) {
      overviewModal = {};
      var rawUrl = util.getRawUrl(modal);
      OVERVIEW.forEach(function (name, i) {
        var prop = OVERVIEW_PROPS[i];
        if (prop) {
          var value = util.getProperty(modal, prop);
          if (value && prop === 'res.ip') {
            value = util.getServerIp(modal);
          } else if (!value && prop === 'clientId') {
            value = util.getProperty(modal, 'req.headers.x-whistle-client-id');
          }
          if (value != null) {
            if (prop == 'req.size' || prop == 'res.size') {
              var size = value;
              value = formatSize(size);
              var unzipSize = value
                ? util.getProperty(modal, prop.substring(0, 4) + 'unzipSize')
                : -1;
              if (unzipSize >= 0 && unzipSize != size) {
                value +=
                  ' / ' +
                  formatSize(unzipSize) +
                  (unzipSize
                    ? ' = ' + Number((size * 100) / unzipSize).toFixed(2) + '%'
                    : '');
              }
            } else if (prop == 'realUrl') {
              if (value == modal.url) {
                value = '';
              } else if (modal.isHttps) {
                value = 'tunnel://' + value;
              }
              realUrl = value;
            } else if (modal.isHttps && prop === 'url') {
              value = 'tunnel://' + value;
            }
          } else if (prop == 'res.statusMessage') {
            value = util.getStatusMessage(modal.res);
          }
          overviewModal[name] = value;
        } else {
          var lastIndex = OVERVIEW.length - 1;
          var time;
          switch (name) {
          case OVERVIEW[lastIndex - 5]:
            time = util.toLocaleString(new Date(modal.startTime));
            break;
          case OVERVIEW[lastIndex - 4]:
            time = getTime(modal.dns);
            break;
          case OVERVIEW[lastIndex - 3]:
            if (modal.requestTime) {
              time = getTime(modal.request);
              var protocol = modal.protocol;
              if (
                  typeof protocol === 'string' &&
                  protocol.indexOf('>') !== -1
                ) {
                var diffTime = modal.httpsTime - modal.dnsTime;
                if (diffTime > 0) {
                  time +=
                      ' - ' +
                      diffTime +
                      'ms(' +
                      protocol +
                      ') = ' +
                      (modal.requestTime - modal.httpsTime) +
                      'ms';
                }
              }
            }
            break;
          case OVERVIEW[lastIndex - 2]:
            time = getTime(modal.response);
            break;
          case OVERVIEW[lastIndex - 1]:
            time = getTime(modal.download);
            break;
          case OVERVIEW[lastIndex]:
            time = getTime(modal.time);
            if (modal.endTime) {
              time = modal.endTime - modal.startTime + 'ms';
            }
            break;
          }
          overviewModal[name] = time;
        }
      });
      var custom1 = columns.getColumn('custom1');
      var custom2 = columns.getColumn('custom2');
      if (modal.sniPlugin) {
        overviewModal['SNI Plugin'] = modal.sniPlugin;
      }
      if (custom1.selected) {
        overviewModal[(dataCenter.custom1 || 'Custom1') + ' '] = modal.custom1;
      }

      if (custom2.selected) {
        overviewModal[(dataCenter.custom2 || 'Custom2') + '  '] = modal.custom2;
      }

      var rules = modal.rules;
      var titleModal = {};
      if (rules) {
        rulesModal = {};
        var atRule = rules.G;
        var clientCert = rules.clientCert;
        var atCtn;
        var atTitle;
        if (atRule) {
          atCtn = [getAtRule(atRule)];
          atTitle = [atRule.raw];
        }
        var pList = rules.P;
        if (pList) {
          pList.forEach(function (item) {
            atCtn = atCtn || [];
            atCtn.push(getVarRule(item));
            atTitle = [item.raw];
          });
        }
        if (clientCert) {
          atCtn = atCtn || [];
          atTitle = atTitle || [];
          atCtn.push(getAtRule(clientCert));
          atTitle.push(clientCert.raw);
        }
        if (atCtn) {
          rulesModal['@'] = atCtn.join('\n');
          titleModal['@'] = atTitle.join('\n');
        }
        PROTOCOLS.forEach(function (name) {
          if (ignoreProtocol(name)) {
            return;
          }
          var key = name;
          if (name === 'reqScript') {
            key = 'rulesFile';
          } else if (name === 'reqMerge') {
            key = 'params';
          } else if (name === 'pathReplace') {
            key = 'urlReplace';
          }
          var rule = rules[key];
          var pluginRule = name === 'plugin' && rules._pluginRule;
          if (pluginRule) {
            hasPluginRule = true;
            var ruleList = [
              pluginRule.rawPattern + ' ' + pluginRule.matcher + getRawProps(pluginRule)
            ];
            var titleList = [pluginRule.raw];
            rule &&
              rule.list &&
              rule.list.forEach(function (item) {
                ruleList.push(item.rawPattern + ' ' + item.matcher + getRawProps(item));
                titleList.push(item.raw);
              });
            rulesModal[name] = ruleList.join('\n');
            titleModal[name] = titleList.join('\n');
          } else if (rule && rule.list) {
            rulesModal[name] = rule.list
              .map(function (rule) {
                return rule.rawPattern + ' ' + rule.matcher + getRawProps(rule);
              })
              .join('\n');
            titleModal[name] = rule.list
              .map(function (rule) {
                return rule.raw;
              })
              .join('\n');
          } else {
            var ruleStr = getRuleStr(rule);
            rulesModal[name] = ruleStr;
            titleModal[name] = rule ? rule.raw : undefined;
            if (name === 'proxy') {
              if (realUrl && ruleStr) {
                rulesModal[name] += ' (' + realUrl + ')';
              }
            } else if (name === 'host') {
              var result = [];
              if (ruleStr) {
                result.push(ruleStr + (realUrl ? ' (' + realUrl + ')' : ''));
              }
              if (rules.proxy && rules.proxy.host) {
                result.push(
                  getRuleStr(rules.proxy.host) + ' (' + rules.proxy.matcher + ')'
                );
              }
              rulesModal[name] = result.join('\n');
            }
          }
        });
      }
    }

    return (
      <div
        ref="container"
        className={
          'fill orient-vertical-box w-detail-content w-detail-overview' +
          (util.getBoolean(this.props.hide) ? ' hide' : '')
        }
      >
        <Properties
          modal={overviewModal}
          rawName="Original Url"
          rawValue={rawUrl}
        />
        <p
          className="w-detail-overview-title"
          style={{ background: showOnlyMatchRules ? 'lightyellow' : undefined }}
        >
          <a href="https://avwo.github.io/whistle/rules/" target="_blank">
            <span className="glyphicon glyphicon-question-sign"></span>
          </a>
          All Rules:
          <label>
            <input
              checked={showOnlyMatchRules}
              onChange={this.showOnlyMatchRules}
              type="checkbox"
            />
            Only show matching rules
          </label>
        </p>
        <Properties
          onHelp={this.onHelp}
          className={showOnlyMatchRules ? 'w-hide-no-value' : undefined}
          modal={rulesModal}
          title={titleModal}
          enableCopyValue
          name="Rules"
          hasPluginRule={hasPluginRule}
        />
      </div>
    );
  }
});

module.exports = Overview;
