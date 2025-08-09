require('./base-css.js');
require('../css/overview.css');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var columns = require('./columns');
var events = require('./events');
var util = require('./util');
var storage = require('./storage');
var Properties = require('./properties');
var dataCenter = require('./data-center');
var getHelpUrl = require('./protocols').getHelpUrl;

var OVERVIEW = [
  'URL',
  'Final URL',
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
  'TTFB',
  'DNS',
  'Request',
  'Response',
  'Download',
  'Total Duration'
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
var CSS_MAP = {
  'TTFB': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': '#ddd'
    }
  },
  'DNS': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': '#8cd2c6'
    }
  },
  'Request': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': '#fdfdb2'
    }
  },
  'Response': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': '#fbb361'
    }
  },
  'Download': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': '#7eabe1'
    }
  }
};
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
  return rule.rawPattern + ' @' + rule.matcher.substring(4) + getPluginName(rule);
}

function getVarRule(rule) {
  return rule.rawPattern + ' %' + rule.matcher.substring(4) + getPluginName(rule);
}

function getStr(str) {
  return str ? ' ' + str : '';
}

function filterImportant(item) {
  return item.indexOf('important') !== -1;
}

function getPluginName(rule) {
  if (!rule) {
    return '';
  }
  var root = rule.root;
  if (root) {
    return /[\\/]whistle\.([a-z\d_\-]+)$/.test(root) ? ' (From plugin: ' + RegExp.$1 + ')' : '';
  }
  return rule.file ? ' (From file: ' + rule.file + ')' : '';
}

function getRawProps(rule, all) {
  var filter = getStr(rule.filter);
  rule = rule.rawProps;
  if (!rule) {
    return filter;
  }
  if (!all) {
    rule = rule.filter(filterImportant);
  }
  return getStr(rule.join(' ')) + filter;
}

function getInjectProps(rule) {
  if (rule.strictHtml) {
    return ' enable://strictHtml';
  }

  return rule.safeHtml ? ' enable://safeHtml' : '';
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
  return rule.rawPattern + ' ' + matcher + getRawProps(rule, true);
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
    $(ReactDOM.findDOMNode(self.refs.rulesOverview)).on('mouseenter', 'td pre', function (e) {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      var target = e.target;
      var text = target.innerText;
      var index = text && text.indexOf(' (From ');
      if (index > 0) {
        target.setAttribute('data-rule-source', '1');
      }
    }).on('mouseleave', 'td pre', function (e) {
      e.target.removeAttribute('data-rule-source');
    }).on('click', 'td pre', function (e) {
      if (!e.ctrlKey && !e.metaKey) {
        return;
      }
      var text = e.target.innerText;
      var index = text && text.indexOf(' (From ');
      if (index > 0) {
        text = text.substring(index + 7, text.length - 1);
        index = text.indexOf(':');
        var type = text.substring(0, index);
        var name = text.substring(index + 1).trim();
        if (!type || !name) {
          return;
        }
        if (type === 'file') {
          events.trigger('showRules', name);
        } else if (type === 'plugin') {
          events.trigger('showPlugins', name);
        }
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
  updateCssMap: function () {
    Object.keys(CSS_MAP).forEach(function (name) {
      CSS_MAP[name].style['--overview-width'] = 0;
    });
    var modal = this.props.modal;
    if (!modal || !modal.url) {
      return;
    }
    var total = modal.endTime - modal.startTime;
    if (!(total > 0)) {
      return;
    }
    CSS_MAP['TTFB'].style['--overview-width'] = modal.ttfb * 100 / total + '%';
    var width = (modal.dnsTime - modal.startTime) * 100 / total + '%';
    CSS_MAP['DNS'].style['--overview-width'] = width;

    var reqStyle = CSS_MAP['Request'].style;
    reqStyle['--overview-left'] = width;
    reqStyle['--overview-width'] = (modal.requestTime - modal.dnsTime) * 100 / total + '%';

    reqStyle = CSS_MAP['Response'].style;
    reqStyle['--overview-left'] = (modal.requestTime - modal.startTime) * 100 / total + '%';
    reqStyle['--overview-width'] = (modal.responseTime - modal.requestTime) * 100 / total + '%';

    reqStyle = CSS_MAP['Download'].style;
    reqStyle['--overview-left'] = (modal.responseTime - modal.startTime) * 100 / total + '%';
    reqStyle['--overview-width'] = (modal.endTime - modal.responseTime) * 100 / total + '%';
  },
  setRulesFile: function (rules) {
    var rulesModal = this.props.rulesModal;
    if (!rulesModal) {
      return;
    }
    var keys = Object.keys(rules);
    if (!keys.length) {
      return;
    }
    var map = rulesModal.getFormattedMap();
    if (!map) {
      return;
    }
    keys.forEach(function (name) {
      rules[name].file = map[rules[name].raw];
    });
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
          var isFinalUrl = prop == 'realUrl';
          if (value != null) {
            if (prop == 'req.size' || prop == 'res.size') {
              value = util.formatSize(value, value ? util.getProperty(modal, prop.substring(0, 4) + 'unzipSize') : -1);
            } else if (isFinalUrl) {
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
          var loc = isFinalUrl && util.getProperty(modal, 'res.headers.location');
          overviewModal[name] = value;
          if (loc) {
            var statusCode = util.getProperty(modal, 'res.statusCode');
            if (loc && (statusCode == 301 || statusCode == 302  || statusCode == 303 ||
              statusCode == 307 || statusCode == 308)) {
              overviewModal['Redirect URL'] = loc;
            }
          }
        } else {
          var lastIndex = OVERVIEW.length - 1;
          var time;
          switch (name) {
          case OVERVIEW[lastIndex - 6]:
            time = util.toLocaleString(new Date(modal.startTime));
            break;
          case OVERVIEW[lastIndex - 5]:
            time = modal.ttfb >= 0 ? modal.ttfb + 'ms' : '';
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
        this.setRulesFile(rules);
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
              pluginRule.rawPattern + ' ' + pluginRule.matcher + getRawProps(pluginRule) + getPluginName(pluginRule)
            ];
            var titleList = [pluginRule.raw];
            rule &&
              rule.list &&
              rule.list.forEach(function (item) {
                ruleList.push(item.rawPattern + ' ' + item.matcher + getRawProps(item) + getPluginName(item));
                titleList.push(item.raw);
              });
            rulesModal[name] = ruleList.join('\n');
            titleModal[name] = titleList.join('\n');
          } else if (rule && rule.list) {
            var prop = getInjectProps(rule);
            rulesModal[name] = rule.list
              .map(function (rule) {
                return rule.rawPattern + ' ' + rule.matcher + getRawProps(rule, true) + prop + getPluginName(rule);
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
            if (name === 'host') {
              var result = [];
              if (ruleStr) {
                result.push(ruleStr + (realUrl ? ' (URL: ' + realUrl + ')' : '') + getPluginName(rule));
              }
              if (rules.proxy && rules.proxy.host) {
                result.push(
                  getRuleStr(rules.proxy.host) + ' (URL: ' + rules.proxy.matcher + ')' + getPluginName(rule)
                );
              }
              rulesModal[name] = result.join('\n');
            } else {
              if (name === 'proxy') {
                if (realUrl && ruleStr) {
                  rulesModal[name] += ' (URL: ' + realUrl + ')';
                }
              }
              if (rulesModal[name]) {
                rulesModal[name] += getPluginName(rule);
              }
            }
          }
        });
      }
    }
    this.updateCssMap();
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
          rawName="Original URL"
          rawValue={rawUrl}
          showEnableBtn={true}
          cssMap={CSS_MAP}
        />
        <p
          className="w-detail-overview-title"
          style={{ background: showOnlyMatchRules ? 'lightyellow' : undefined }}
        >
          <a href={util.getDocsBaseUrl('rules/protocols.html')} target="_blank">
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
          ref="rulesOverview"
          onHelp={this.onHelp}
          className={showOnlyMatchRules ? 'w-hide-no-value w-rules-overview' : 'w-rules-overview'}
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
