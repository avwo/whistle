var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var util = require('./util');
var events = require('./events');
var win = require('./win');
var CopyBtn = require('./copy-btn');
var RecordBtn = require('./record-btn');

var MAX_COUNT = 360;
var PAGE_SIZE = 30;
var MAX_FILE_SIZE = 1024 * 1024 * 2;
var LOG_TEXT_KEY = window.Symbol ? window.Symbol('logText') : 'logText';

module.exports = {
  LOG_TEXT_KEY: LOG_TEXT_KEY,
  componentDidUpdate: function () {
    var self = this;
    if (!self.isHide() && self.state.scrollToBottom) {
      self.container.scrollTop = 10000000;
    }
  },
  shouldComponentUpdate: function (nextProps) {
    var self = this;
    var hide = util.getBool(self.props.hide);
    var toggleHide = hide != util.getBool(nextProps.hide);
    if (toggleHide || !hide) {
      if (!toggleHide && !hide) {
        self.state.scrollToBottom = util.scrollAtBottom(
          self.container,
          self.content
        );
      }
      clearTimeout(self.filterTimer);
      clearTimeout(self.scrollTimer);
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
    var state = self.state;
    var logs = state.logs;
    var backBtn = self.refs.backBtn;
    var atBottom = util.scrollAtBottom(self.container, self.content);
    clearTimeout(self.scrollTimer);
    if (logs && (state.scrollToBottom = atBottom)) {
      self.scrollTimer = setTimeout(self.trimLogs, 2000);
    }
    if (atBottom) {
      backBtn.hide();
    } else {
      backBtn.show();
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
    logs = util.filterLogList(logs, keys);
    self.state.logs = logs;
    self.trimLogs();
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
  trimLogs: function () {
    var logs = this.state.logs;
    var len = logs.length - MAX_COUNT;
    len > 9 && util.trimLogList(logs, len, this.keyword);
  },
  isHide: function () {
    var self = this;
    if (self.props.hide) {
      return true;
    }
    var btn = self._importBtn;
    if (!btn) {
      btn = findDOMNode(self.refs.importBtn);
      self._importBtn = btn;
    }
    return !btn || !btn.offsetWidth;
  },
  updateLogs: function(newLogs) {
    var self = this;
    var state = self.state;
    var logs = state.logs;
    var len = logs.length;
    if (!newLogs.length || self.isHide() || len > MAX_COUNT) {
      return;
    }
    var pageSize = Math.max(PAGE_SIZE, Math.floor((MAX_COUNT - len) * 2 / 3));
    newLogs = newLogs.splice(0, pageSize);
    state.logs = util.filterLogList(logs.concat(newLogs), self.keyword, true);
    var atBottom = util.scrollAtBottom(self.container, self.content);
    atBottom && self.trimLogs();
    self.setState({});
  },
  handleImport: function (_, result) {
    var self = this;
    if (self.isHide()) {
      return;
    }
    self.state.logs = self.state.logs.concat(result.logs);
    self.trimLogs();
    self.setState({});
  },
  renderCopy: function (text, log) {
    var self = this;
    return <CopyBtn title="Copy log text" value={function() {
      return self.getLogText(text, log);
    }} />;
  },
  renderActionBar: function(disabled) {
    var self = this;
    return (<div className="w-textarea-bar">
      <RecordBtn onClick={self.handleAction} />
      <a ref="importBtn" onClick={self.selectFile} draggable="false">
        Import
      </a>
      <a
        className={disabled ? 'w-disabled' : ''}
        onClick={disabled ? undefined : self.export}
        draggable="false"
      >
        Export
      </a>
      <a
        className={'w-clear' + (disabled ? ' w-disabled' : '')}
        onClick={disabled ? undefined : self.clearLogs}
        draggable="false"
      >
        Clear
      </a>
    </div>);
  }
};
