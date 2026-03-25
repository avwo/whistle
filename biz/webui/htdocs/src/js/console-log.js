var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var JSONTree = require('./components/react-json-tree')['default'];
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');
var DropDown = require('./dropdown');
var events = require('./events');
var storage = require('./storage');
var BackToBottomBtn = require('./back-to-bottom-btn');
var LogMixin = require('./log-mixin');

var findDOMNode = ReactDOM.findDOMNode;
var VIEW_KEY =  window.Symbol ? window.Symbol('view') : 'view';

function parseLog(log, expandRoot) {
  if (log[VIEW_KEY]) {
    return log[VIEW_KEY];
  }
  try {
    var logText = [];
    var data = JSON.parse(log.text);
    var hasNonStr = data.some(function (obj) {
      return typeof obj !== 'string' || obj === 'undefined';
    });
    log[VIEW_KEY] = data.map(function (data) {
      if (typeof data === 'string' && data !== 'undefined') {
        data = hasNonStr ? '"' + data + '"' : data;
        logText.push(data);
        return <ExpandCollapse text={data} />;
      }
      if (!data || typeof data !== 'object') {
        data = String(data);
        logText.push(data);
        return (
          <ExpandCollapse
            wStyle={{ color: 'var(--c-has)' }}
            text={data}
          />
        );
      }
      logText.push(JSON.stringify(data, null, 2));
      return (
        <JSONTree
          data={data}
          onSearch={function() {
            util.showJSONDialog(data);
          }}
          shouldExpandNode={expandRoot ? undefined : false}
        />
      );
    });
    log[LogMixin.LOG_TEXT_KEY] = logText.join(' ');
    return log[VIEW_KEY];
  } catch (e) {}
  return <ExpandCollapse text={log.text} />;
}

function getLogInfo(log, level) {
  var result = ['Level: ' + level];
  if (log.logId) {
    result.unshift('LogID: ' + log.logId);
  }
  return ' (' + result.join(', ') + ')';
}

var Console = React.createClass({
  name: 'console',
  mixins: [LogMixin],
  getInitialState: function () {
    return {
      scrollToBottom: true,
      logIdList: [{
        value: '',
        text: 'All Logs'
      }],
      logs: [],
      logId: '',
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
          text: 'Info'
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
      ],
      expandRoot: storage.get('expandJsonRoot') != 1
    };
  },
  componentDidMount: function () {
    var self = this;
    var container = (this.container = findDOMNode(
      self.refs.container
    ));
    this.content = findDOMNode(self.refs.logContent);

    events.on('uploadLogs', self.handleImport);
    dataCenter.on('log', self.updateLogs);

    events.on('consoleImportFile', function (_, file) {
      self.importFile(file);
    });
    events.on('consoleImportData', function (_, data) {
      self.importData(data);
    });

    $(container).on('scroll', self.handleScroll);
  },
  changeLogId: function (option) {
    this.showLogId(option.value);
  },
  clearLogs: function () {
    dataCenter.clearLogList();
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
      dataCenter.pauseConsoleRecord();
      return;
    }
    var refresh = type === 'refresh';
    dataCenter.stopConsoleRecord(!refresh);
    if (refresh) {
      return this.autoRefresh();
    }
  },
  onBeforeShow: function () {
    this.showLogId(this.state.logId);
  },
  showLogId: function (id) {
    var options = dataCenter.getLogIdOptions(id);
    dataCenter.changeLogId(options.logId);
    this.setState(options);
  },
  changeExpandRoot: function (e) {
    this.state.expandRoot = e.target.checked;
  },
  render: function () {
    var self = this;
    var state = self.state;
    var logs = state.logs;
    var logIdList = state.logIdList;
    var level = state.level;
    var expandRoot = state.expandRoot;
    var index = 0;
    var className = self.props.className;

    return (
      <div
        className={
          'fill v-box w-textarea w-log' + (className ? ' ' + className : '') +
          (self.props.hide ? ' hide' : '')
        }
      >
        <div className="w-log-action-bar">
          <DropDown
            onBeforeShow={self.onBeforeShow}
            value={state.logId}
            help={util.getDocUrl('gui/console.html')}
            onChange={self.changeLogId}
            options={logIdList}
          />
          <DropDown onChange={self.changeLevel} options={state.levels} />
          <label className="w-log-expand-root">
            <input
              type="checkbox"
              defaultChecked={expandRoot}
              onChange={self.changeExpandRoot}
            />
            Expand JSON Root
          </label>
          {this.renderActionBar(!util.hasVisibleLog(logs))}
        </div>
        <div ref="container" className="fill w-log-ctn">
          <ul ref="logContent">
            {logs.map(function (log) {
              var upper = log.level.toUpperCase();
              var date =
                'Date: ' +
                util.toLocaleString(new Date(log.date)) +
                getLogInfo(log, upper) + '\r\n';
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
                  {self.renderCopy(date, log)}
                  <pre>
                    <strong>#{index}</strong>
                    {date}
                    {parseLog(log, expandRoot)}
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

module.exports = Console;
