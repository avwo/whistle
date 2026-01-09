var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');
var RecordBtn = require('./record-btn');
var events = require('./events');
var DropDown = require('./dropdown');
var win = require('./win');

var MAX_COUNT = dataCenter.MAX_LOG_LENGTH;
var MAX_FILE_SIZE = 1024 * 1024 * 2;
var findDOMNode = ReactDOM.findDOMNode;

var ServerLog = React.createClass({
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
    var svrContainer = (this.container = findDOMNode(
      self.refs.svrContainer
    ));
    var svrContent = (this.content = findDOMNode(
      self.refs.svrContent
    ));

    var updateLogs = function (_, svrLogs) {
      var state = self.state;
      var curLogs = state.logs;
      if (curLogs !== svrLogs && Array.isArray(curLogs)) {
        svrLogs.push.apply(svrLogs, curLogs);
      }
      state.logs = util.filterLogList(svrLogs, self.keyword, true);
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(svrContainer, svrContent);
      if (atBottom) {
        var len = svrLogs.length - MAX_COUNT;
        len > 9 && util.trimLogList(svrLogs, len, self.keyword);
      }
      self.setState({});
    };
    if (dataCenter.uploadLogs) {
      updateLogs(null, dataCenter.uploadLogs);
      dataCenter.uploadLogs = null;
    }
    events.on('uploadLogs', function (_, result) {
      if (self.props.hide) {
        return;
      }
      var logs = result.logs;
      var curLogs = self.state.logs;
      if (curLogs) {
        curLogs.push.apply(curLogs, logs);
        var overflow = curLogs.length - MAX_COUNT;
        overflow > 19 && util.trimLogList(curLogs, overflow, self.keyword);
      } else {
        curLogs = logs;
      }
      updateLogs(null, curLogs);
    });
    dataCenter.on('log', updateLogs);

    var svrTimeout;
    $(svrContainer).on('scroll', function () {
      var data = self.state.logs;
      svrTimeout && clearTimeout(svrTimeout);
      if (
        data &&
        (self.state.scrollToBottom = util.scrollAtBottom(
          svrContainer,
          svrContent
        ))
      ) {
        svrTimeout = setTimeout(function () {
          var len = data.length - MAX_COUNT;
          if (len > 9) {
            util.trimLogList(data, len, self.keyword);
            self.setState({});
          }
        }, 2000);
      }
    });

    events.on('serverImportFile', function (_, file) {
      self.importFile(file);
    });
    events.on('serverImportData', function (_, data) {
      self.importData(data);
    });
  },
  clearLogs: function () {
    dataCenter.clearedSvrLogs = true;
    dataCenter.clearSvgLogList();
    this.setState({ logs: [] });
  },
  stopAutoRefresh: function () {
    if (util.scrollAtBottom(this.container, this.content)) {
      this.container.scrollTop = this.container.scrollTop - 10;
    }
  },
  scrollTop: function () {
    this.container.scrollTop = 0;
  },
  autoRefresh: function () {
    this.container.scrollTop = 10000000;
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBool(this.props.hide);
    var toggleHide = hide != util.getBool(nextProps.hide);
    if (toggleHide || !hide) {
      if (!toggleHide && !hide) {
        this.state.scrollToBottom = util.scrollAtBottom(
          this.container,
          this.content
        );
      }
      clearTimeout(this.filterTimer);
      return true;
    }
    return false;
  },
  componentDidUpdate: function () {
    if (!this.props.hide && this.state.scrollToBottom) {
      this.container.scrollTop = 10000000;
    }
  },
  onServerFilterChange: function (keyword) {
    var self = this;
    keyword = keyword.trim();
    var serverKeyword = util.parseKeyword(keyword);
    var logs = self.state.logs;
    self.keyword = keyword && serverKeyword;
    util.filterLogList(logs, serverKeyword);
    if (!keyword) {
      var len = logs && logs.length - MAX_COUNT;
      len > 9 && logs.splice(0, len);
    }
    clearTimeout(self.filterTimer);
    self.filterTimer = setTimeout(function () {
      self.filterTimer = null;
      self.setState({});
    }, 500);
  },
  selectFile: function () {
    events.trigger('showImportDialog', 'server');
  },
  changeLevel: function (option) {
    this.setState({ level: option.value });
  },
  importFile: function (file) {
    if (!file || !/\.log$/i.test(file.name)) {
      return win.alert('Only .log files are supported');
    }
    if (file.size > MAX_FILE_SIZE) {
      return win.alert('Maximum file size: 2MB');
    }
    util.readFileAsText(file, this.importData);
  },
  importData: function (logs) {
    logs = util.parseLogs(logs);
    logs && events.trigger('uploadLogs', { logs: logs });
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
  export: function () {
    var logs = [];
    this.state.logs.forEach(function (log) {
      if (!log.hide) {
        logs.push({
          id: log.id,
          text: log.text,
          level: log.level,
          date: log.date
        });
      }
    });
    events.trigger('showExportDialog', ['server', logs]);
  },
  render: function () {
    var state = this.state;
    var logs = state.logs || [];
    var level = state.level;
    var disabled = !util.hasVisibleLog(logs);
    var index = 0;

    return (
      <div
        className={
          'fill orient-vertical-box w-textarea w-detail-svr-log' +
          (this.props.hide ? ' hide' : '')
        }
      >
        <div className="w-log-action-bar">
          <DropDown onChange={this.changeLevel} options={state.levels} />
          <div className="w-textarea-bar">
            <RecordBtn onClick={this.handleAction} />
            <a className="w-import" onClick={this.selectFile} draggable="false">
              Import
            </a>
            <a
              className={'w-download' + (disabled ? ' w-disabled' : '')}
              onClick={disabled ? undefined : this.export}
              draggable="false"
            >
              Export
            </a>
            <a
              className={'w-clear' + (disabled ? ' w-disabled' : '')}
              onClick={disabled ? undefined : this.clearLogs}
              draggable="false"
            >
              Clear
            </a>
          </div>
        </div>
        <div ref="svrContainer" className="fill w-detail-log-content">
          <ul ref="svrContent">
            {logs.map(function (log) {
              var text =
                'Date: ' +
                util.toLocaleString(new Date(log.date)) +
                '\r\n' +
                log.text;
              var hide =
                log.hide || (level && !hide && log.level !== level)
                  ? ' hide'
                  : '';
              if (!hide) {
                ++index;
              }
              return (
                <li
                  key={log.id}
                  title={log.level.toUpperCase()}
                  className={'w-' + log.level + hide}
                >
                  <pre>
                    <strong>#{index}</strong>
                    {text && text.length >= 2100 ? (
                      <ExpandCollapse text={text} />
                    ) : (
                      text
                    )}
                  </pre>
                </li>
              );
            })}
          </ul>
        </div>
        <FilterInput onChange={this.onServerFilterChange} />
      </div>
    );
  }
});

module.exports = ServerLog;
