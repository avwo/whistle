var React = require('react');
var util = require('./util');
var events = require('./events');
var win = require('./win');
var CopyBtn = require('./copy-btn');
var dataCenter = require('./data-center');
var RecordBtn = require('./record-btn');

var MAX_COUNT = dataCenter.MAX_LOG_LENGTH;
var MAX_FILE_SIZE = 1024 * 1024 * 2;
var LOG_TEXT_KEY = window.Symbol ? window.Symbol('logText') : 'logText';

module.exports = {
  LOG_TEXT_KEY: LOG_TEXT_KEY,
  componentDidUpdate: function () {
    if (!this.props.hide && this.state.scrollToBottom) {
      this.container.scrollTop = 10000000;
    }
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
      clearTimeout(this.scrollTimer);
      return true;
    }
    return false;
  },
  selectFile: function () {
    events.trigger('showImportDialog', this.name);
  },
  changeLevel: function (option) {
    this.setState({ level: option.value });
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
  handleScroll: function () {
    var self = this;
    var data = self.state.logs;
    var atBottom = util.scrollAtBottom(self.container, self.content);
    clearTimeout(self.scrollTimer);
    if (
        data &&
        (self.state.scrollToBottom = atBottom)
      ) {
      self.scrollTimer = setTimeout(function () {
        var len = data.length - MAX_COUNT;
        self.scrollTimer = null;
        if (len > 9) {
          util.trimLogList(data, len, self.keyword);
          self.setState({ logs: data });
        }
      }, 2000);
    }
    if (atBottom) {
      self.refs.backBtn.hide();
    } else {
      self.refs.backBtn.show();
    }
  },
  importData: function (logs) {
    logs = util.parseLogs(logs);
    logs && events.trigger('uploadLogs', { logs: logs });
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
  handleFilterChange: function (keyword) {
    var self = this;
    keyword = keyword.trim();
    var keys = util.parseKeyword(keyword);
    var logs = self.state.logs;
    self.keyword = keyword && keys;
    util.filterLogList(logs, keys);
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
    events.trigger('showExportDialog', [this.name, logs]);
  },
  getLogText: function (text, log) {
    log = log && (log[LOG_TEXT_KEY] || log.text);
    return log ? text + '\n' + log : text;
  },
  updateLogs: function(logs) {
    var state = this.state;
    var curLogs = state.logs;
    if (curLogs !== logs && Array.isArray(curLogs)) {
      logs.push.apply(logs, curLogs);
    }
    state.logs = util.filterLogList(logs, this.keyword, true);
    if (this.props.hide) {
      return;
    }
    var atBottom = util.scrollAtBottom(this.container, this.content);
    if (atBottom) {
      var len = logs.length - MAX_COUNT;
      len > 9 && util.trimLogList(logs, len, this.keyword);
    }
    this.setState({});
  },
  handleImport: function (_, result) {
    if (this.props.hide) {
      return;
    }
    var logs = result.logs;
    var curLogs = this.state.logs;
    if (curLogs) {
      curLogs.push.apply(curLogs, logs);
      var overflow = curLogs.length - MAX_COUNT;
      overflow > 19 && util.trimLogList(curLogs, overflow, this.keyword);
    } else {
      curLogs = logs;
    }
    this.updateLogs(curLogs);
  },
  renderCopy: function (text, log) {
    var self = this;
    return <CopyBtn title="Copy log text" value={function() {
      return self.getLogText(text, log);
    }} />;
  },
  renderActionBar: function(disabled) {
    return (<div className="w-textarea-bar">
      <RecordBtn onClick={this.handleAction} />
      <a onClick={this.selectFile} draggable="false">
        Import
      </a>
      <a
        className={disabled ? 'w-disabled' : ''}
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
    </div>);
  }
};
