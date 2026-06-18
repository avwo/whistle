require('../css/overview.css');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var columns = require('./columns');
var events = require('./events');
var util = require('./util');
var storage = require('./storage');
var Properties = require('./properties');
var dataCenter = require('./data-center');
var HelpIcon = require('./help-icon');
var MatchedRule = require('./matched-rule');

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
      '--overview-bg': 'var(--b-active)'
    }
  },
  'DNS': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': 'var(--b-tl-dns)'
    }
  },
  'Request': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': 'var(--b-tl-req)'
    }
  },
  'Response': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': 'var(--b-tl-res)'
    }
  },
  'Download': {
    className: 'w-overview-timeline',
    style: {
      '--overview-bg': 'var(--b-tl-load)'
    }
  }
};
var DEFAULT_OVERVIEW_MODAL = {};


function getTime(time) {
  return time === '-' ? '' : time;
}

OVERVIEW.forEach(function (name) {
  DEFAULT_OVERVIEW_MODAL[name] = '';
});

var Overview = React.createClass({
  getInitialState: function () {
    return {
      showOnlyMatchRules: storage.get('showOnlyMatchRules') == 1
    };
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  componentDidMount: function () {
    var self = this;
    var container = findDOMNode(self.refs.container);
    events.on('overviewScrollTop', function () {
      if (!util.getBool(self.props.hide)) {
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
  render: function () {
    var overviewModal = DEFAULT_OVERVIEW_MODAL;
    var self = this;
    var modal = self.props.modal;
    var showOnlyMatchRules = self.state.showOnlyMatchRules;

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
              if (util.isStr(protocol) && protocol.indexOf('>') !== -1) {
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
    }
    self.updateCssMap();

    return (
      <div
        ref="container"
        className={
          'fill v-box w-detail-ctn w-detail-overview' +
          (util.getBool(self.props.hide) ? ' hide' : '')
        }
      >
        <Properties
          modal={overviewModal}
          rawName="Original URL"
          rawValue={rawUrl}
          showEnableBtn={modal && !modal.importedData}
          cssMap={CSS_MAP}
        />
        <p
          className="w-detail-overview-title"
          style={{ background: showOnlyMatchRules ? 'var(--b-filtered)' : undefined }}
        >
          <HelpIcon docsUrl="rules/protocols.html" />
          All Rules:
          <label>
            <input
              checked={showOnlyMatchRules}
              onChange={self.showOnlyMatchRules}
              type="checkbox"
            />
            Show matching rules only
          </label>
        </p>
        <MatchedRule
          showOnlyMatchRules={showOnlyMatchRules}
          modal={modal}
        />
      </div>
    );
  }
});

module.exports = Overview;
