var React = require('react');
var ReactDOM = require('react-dom');
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
    if (!this.isHide() && this.state.scrollToBottom) {
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
    var logs = self.state.logs;
    var atBottom = util.scrollAtBottom(self.container, self.content);
    clearTimeout(self.scrollTimer);
    if (logs && (self.state.scrollToBottom = atBottom)) {
      self.scrollTimer = setTimeout(self.trimLogs, 2000);
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
    if (this.props.hide) {
      return true;
    }
    var btn = this._importBtn;
    if (!btn) {
      btn = ReactDOM.findDOMNode(this.refs.importBtn);
      this._importBtn = btn;
    }
    return !btn || !btn.offsetWidth;
  },
  updateLogs: function(newLogs) {
    var state = this.state;
    var logs = state.logs;
    var len = logs.length;
    if (!newLogs.length || this.isHide() || len > MAX_COUNT) {
      return;
    }
    var pageSize = Math.max(PAGE_SIZE, Math.floor((MAX_COUNT - len) * 2 / 3));
    newLogs = newLogs.splice(0, pageSize);
    state.logs = util.filterLogList(logs.concat(newLogs), this.keyword, true);
    var atBottom = util.scrollAtBottom(this.container, this.content);
    atBottom && this.trimLogs();
    this.setState({});
  },
  handleImport: function (_, result) {
    if (this.isHide()) {
      return;
    }
    this.state.logs = this.state.logs.concat(result.logs);
    this.trimLogs();
    this.setState({});
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
      <a ref="importBtn" onClick={this.selectFile} draggable="false">
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
