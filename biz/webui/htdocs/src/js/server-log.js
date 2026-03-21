var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');
var events = require('./events');
var DropDown = require('./dropdown');
var BackToBottomBtn = require('./back-to-bottom-btn');
var LogMixin = require('./log-mixin');

var findDOMNode = ReactDOM.findDOMNode;

var ServerLog = React.createClass({
  name: 'server',
  mixins: [LogMixin],
  getInitialState: function () {
    return {
      scrollToBottom: true,
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
    var container = (this.container = findDOMNode(
      self.refs.svrContainer
    ));
    this.content = findDOMNode(self.refs.svrContent);

    events.on('uploadLogs', self.handleImport);
    dataCenter.on('log', function(_, logs) {
      self.updateLogs(logs);
    });

    $(container).on('scroll', self.handleScroll);

    events.on('serverImportFile', function (_, file) {
      self.importFile(file);
    });
    events.on('serverImportData', function (_, data) {
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
    var logs = state.logs || [];
    var level = state.level;
    var index = 0;

    return (
      <div
        className={
          'fill v-box w-textarea w-server-log' +
          (self.props.hide ? ' hide' : '')
        }
      >
        <div className="w-log-action-bar">
          <DropDown onChange={self.changeLevel} options={state.levels} />
          {this.renderActionBar(!util.hasVisibleLog(logs))}
        </div>
        <div ref="svrContainer" className="fill w-log-ctn">
          <ul ref="svrContent">
            {logs.map(function (log) {
              var upper = log.level.toUpperCase();
              var text =
                'Date: ' +
                util.toLocaleString(new Date(log.date)) +
                ' (Level: ' + upper + ')' +
                '\r\n' + log.text;
              var hide = log.hide || (level && log.level !== level) ? ' hide' : '';
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
