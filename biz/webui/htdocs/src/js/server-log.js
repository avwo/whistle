var $ = require('jquery');
var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');
var DropDown = require('./dropdown');
var BackToBottomBtn = require('./back-to-bottom-btn');
var LogMixin = require('./log-mixin');

var addEvent = util.on;
var getHide = util.getHide;

var ServerLog = React.createClass({
  name: 'server',
  mixins: [LogMixin],
  getInitialState: function () {
    return {
      scrollToBottom: true,
      logs: [],
      levels: [
        {
          value: '',
          text: 'All Levels'
        },
        {
          value: 'debug',
          text: 'Debug'
        },
        {
          value: 'info',
          text: 'Info/Log'
        },
        {
          value: 'warn',
          text: 'Warn'
        },
        {
          value: 'error',
          text: 'Error'
        },
        {
          value: 'fatal',
          text: 'Fatal'
        }
      ]
    };
  },
  componentDidMount: function () {
    var self = this;
    var container = (self.container = findDOMNode(
      self.refs.svrContainer
    ));
    self.content = findDOMNode(self.refs.svrContent);

    addEvent('uploadLogs', self.handleImport);
    dataCenter.on('log', function(_, logs) {
      self.updateLogs(logs);
    });

    $(container).on('scroll', self.handleScroll);

    addEvent('serverImportFile', function (_, file) {
      self.importFile(file);
    });
    addEvent('serverImportData', function (_, data) {
      self.importData(data);
    });
  },
  clearLogs: function () {
    dataCenter.clearSvgLogList();
    this.setState({ logs: [] });
  },
  handleAction: function (type) {
    if (type === 'top') {
      return this.scrollTop();
    }
    if (type === 'bottom') {
      return this.autoRefresh();
    }
    if (type === 'pause') {
      dataCenter.pauseServerLogRecord();
      return;
    }
    var refresh = type === 'refresh';
    dataCenter.stopServerLogRecord(!refresh);
    if (refresh) {
      return this.autoRefresh();
    }
  },
  render: function () {
    var self = this;
    var state = self.state;
    var logs = state.logs;
    var level = state.level;
    var index = 0;

    return (
      <div
        className={
          'fill v-box w-textarea w-server-log' +
          getHide(self.props.hide)
        }
      >
        <div className="w-log-action-bar">
          <DropDown onChange={self.changeLevel} options={state.levels} />
          {self.renderActionBar(!util.hasVisibleLog(logs))}
        </div>
        <div ref="svrContainer" className="fill w-log-ctn">
          <ul ref="svrContent">
            {logs.map(function (log) {
              var upper = log.level.toUpperCase();
              var text =
                'Date: ' +
                util.toDateStr(log.date) +
                ' (Level: ' + upper + ')' +
                '\r\n' + log.text;
              var hide = getHide(log.hide || (level && log.level !== level));
              if (!hide) {
                ++index;
              }
              return (
                <li
                  key={log.id}
                  title={upper}
                  className={'w-log-item w-' + log.level + hide}
                >
                  {self.renderCopy(text)}
                  <pre>
                    <strong>#{index}</strong>
                    {text.length >= 2100 ? <ExpandCollapse text={text} /> : text}
                  </pre>
                </li>
              );
            })}
          </ul>
        </div>
        <BackToBottomBtn ref="backBtn" onClick={self.autoRefresh} />
        <FilterInput onChange={self.handleFilterChange} />
      </div>
    );
  }
});

module.exports = ServerLog;
