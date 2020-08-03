require('./base-css.js');
require('../css/tools.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var JSONTree = require('./components/react-json-tree')['default'];
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');
var DropDown = require('./dropdown');
var RecordBtn = require('./record-btn');
var events = require('./events');
var storage = require('./storage');

var MAX_COUNT = 90;
var MAX_FILE_SIZE = 1024 * 1024 * 2;

var allLogs = {
  value: '',
  text: 'All logs'
};

function parseLog(log, expandRoot) {
  if (log.view) {
    return log.view;
  }
  try {
    var data = JSON.parse(log.text);
    var hasNonStr = data.some(function(obj) {
      return typeof obj !== 'string' || obj === 'undefined';
    });
    log.view = data.map(function(data) {
      if (typeof data === 'string' && data !== 'undefined') {
        return <ExpandCollapse text={hasNonStr ? '"' + data + '"' : data} />;
      }
      if (!data || typeof data !== 'object') {
        return <ExpandCollapse wStyle={{color: 'rgb(203, 75, 22)'}} text={data + ''} />;
      }
      return <JSONTree data={data} shouldExpandNode={expandRoot ? undefined : false} />;
    });
    return log.view;
  } catch(e) {}
  return <ExpandCollapse text={log.text} />;
}

var Console = React.createClass({
  getInitialState: function() {
    return {
      scrollToBottom: true,
      logIdList: [allLogs],
      levels: [
        {
          value: '',
          text: 'All levels'
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
      ],
      expandRoot: storage.get('expandJsonRoot') != 1
    };
  },
  componentDidMount: function() {
    var self = this;
    var container = this.container = ReactDOM.findDOMNode(self.refs.container);
    var content = this.content = ReactDOM.findDOMNode(self.refs.logContent);
    var updateLogs = function(logs) {
      var state = self.state;
      var curLogs = state.logs;
      if (curLogs !== logs && Array.isArray(curLogs)) {
        logs.push.apply(logs, curLogs);
      }
      state.logs = logs;
      util.filterLogList(state.logs, self.keyword);
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(container, content);
      if (atBottom) {
        var len = logs.length - MAX_COUNT;
        len > 9 && util.trimLogList(logs, len, self.keyword);
      }
      self.setState({});
    };

    if (dataCenter.uploadLogs) {
      updateLogs(dataCenter.uploadLogs);
      dataCenter.uploadLogs = null;
    }
    events.on('uploadLogs', function(_, result) {
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
      updateLogs(curLogs);
    });
    dataCenter.on('log', updateLogs);
    $(container).on('scroll', function() {
      var data = self.state.logs;
      clearTimeout(self.scrollTimer);
      if (data && (self.state.scrollToBottom = util.scrollAtBottom(container, content))) {
        self.scrollTimer = setTimeout(function() {
          var len = data.length - MAX_COUNT;
          self.scrollTimer = null;
          if (len > 9) {
            util.trimLogList(data, len, self.keyword);
            self.setState({logs: data});
          }
        }, 2000);
      }
    });
  },
  selectFile: function() {
    ReactDOM.findDOMNode(this.refs.importData).click();
  },
  importData: function() {
    var form = new FormData(ReactDOM.findDOMNode(this.refs.importDataForm));
    var file = form.get('importData');
    if (!file || !/\.log$/i.test(file.name)) {
      return alert('Only supports .log file.');
    }
    if (file.size > MAX_FILE_SIZE) {
      return alert('The file size cannot exceed 2m.');
    }
    util.readFileAsText(file, function(logs) {
      logs = util.parseLogs(logs);
      logs && events.trigger('uploadLogs', {logs: logs});
    });
    ReactDOM.findDOMNode(this.refs.importData).value = '';
  },
  changeLogId: function(option) {
    dataCenter.changeLogId(option.value);
  },
  changeLevel: function(option) {
    this.setState({ level: option.value });
  },
  clearLogs: function() {
    var data = this.state.logs;
    data && data.splice(0, data.length);
    this.setState({});
  },
  scrollTop: function() {
    this.container.scrollTop = 0;
  },
  autoRefresh: function() {
    this.container.scrollTop = 10000000;
  },
  stopAutoRefresh: function() {
    if (util.scrollAtBottom(this.container, this.content)) {
      this.container.scrollTop = this.container.scrollTop - 10;
    }
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    var toggleHide = hide != util.getBoolean(nextProps.hide);
    if (toggleHide || !hide) {
      if (!toggleHide && !hide) {
        this.state.scrollToBottom = util.scrollAtBottom(this.container, this.content);
      }
      clearTimeout(this.filterTimer);
      clearTimeout(this.scrollTimer);
      return true;
    }
    return false;
  },
  componentDidUpdate: function() {
    if (!this.props.hide && this.state.scrollToBottom) {
      this.container.scrollTop = 10000000;
    }
  },
  onConsoleFilterChange: function(keyword) {
    var self = this;
    keyword = keyword.trim();
    self.keyword = keyword;
    var logs = self.state.logs;
    var consoleKeyword = util.parseKeyword(keyword);
    util.filterLogList(logs, consoleKeyword);
    if (!keyword) {
      var len = logs && (logs.length - MAX_COUNT);
      len > 9 && logs.splice(0, len);
    }
    clearTimeout(self.filterTimer);
    self.filterTimer = setTimeout(function() {
      self.filterTimer = null;
      self.setState({ consoleKeyword: consoleKeyword });
    }, 600);
  },
  showNameInput: function(e) {
    var self = this;
    self.setState({
      showNameInput: true
    }, function() {
      ReactDOM.findDOMNode(self.refs.nameInput).focus();
    });
  },
  download: function() {
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    var logs = [];
    this.state.logs.forEach(function(log) {
      if (!log.hide) {
        logs.push({
          id: log.id,
          text: log.text,
          level: log.level,
          date: log.date
        });
      }
    });
    target.value = '';
    ReactDOM.findDOMNode(this.refs.filename).value = name;
    ReactDOM.findDOMNode(this.refs.content).value = JSON.stringify(logs, null, '  ');
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
    this.hideNameInput();
  },
  submit: function(e) {
    if (e.keyCode !== 13 && e.type != 'click') {
      return;
    }
    this.download();
  },
  preventBlur: function(e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  hideNameInput: function() {
    this.setState({ showNameInput: false });
  },
  handleAction: function(type) {
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
  onBeforeShow: function() {
    var list = dataCenter.getLogIdList() || [];
    list = list.map(function(id) {
      return {
        value: id,
        text: id
      };
    });
    list.unshift(allLogs);
    this.setState({
      logIdList: list
    });
  },
  changeExpandRoot: function(e) {
    this.state.expandRoot = e.target.checked;
  },
  render: function() {
    var state = this.state;
    var logs = state.logs || [];
    var logIdList = state.logIdList;
    var level = state.level;
    var expandRoot = state.expandRoot;
    var disabled = !util.hasVisibleLog(logs);

    return (
      <div className={'fill orient-vertical-box w-textarea w-detail-page-log' + (this.props.hide ? ' hide' : '')}>
        <div className="w-log-action-bar">
          <DropDown
            onBeforeShow={this.onBeforeShow}
            help="https://avwo.github.io/whistle/webui/log.html"
            onChange={this.changeLogId}
            options={logIdList}
          />
          <DropDown
            onChange={this.changeLevel}
            options={state.levels}
          />
          <label className="w-log-expand-root">
            <input type="checkbox" defaultChecked={expandRoot} onChange={this.changeExpandRoot} />
            Expand JSON Root 
          </label>
          <div className="w-textarea-bar">
            <a className="w-import" onClick={this.selectFile}
              draggable="false">Import</a>
            <a className={'w-download' + (disabled ? ' w-disabled' : '')} onDoubleClick={disabled ? undefined : this.download}
              onClick={disabled ? undefined : this.showNameInput} draggable="false">Export</a>
            <RecordBtn onClick={this.handleAction} />
            <a className={'w-clear' + (disabled ? ' w-disabled' : '')} onClick={disabled ? undefined : this.clearLogs} draggable="false">Clear</a>
            <div onMouseDown={this.preventBlur}
              style={{display: this.state.showNameInput ? 'block' : 'none'}}
              className="shadow w-textarea-input"><input ref="nameInput"
              onKeyDown={this.submit}
              onBlur={this.hideNameInput}
              type="text"
              maxLength="64"
              placeholder="Input the filename"
            />
              <button type="button" onClick={this.submit} className="btn btn-primary">OK</button>
            </div>
            <form ref="downloadForm" action="cgi-bin/download" style={{display: 'none'}}
              method="post" target="downloadTargetFrame">
              <input ref="type" name="type" value="log" type="hidden" />
              <input ref="filename" name="filename" type="hidden" />
              <input ref="content" name="content" type="hidden" />
            </form>
          </div>
        </div>
        <form ref="importDataForm" encType="multipart/form-data" style={{display: 'none'}}>
          <input ref="importData" onChange={this.importData} type="file" name="importData" accept=".log" />
        </form>
        <div ref="container" className="fill w-detail-log-content">
          <ul ref="logContent">
            {logs.map(function(log) {
              var logId = log.logId;
              logId = logId ? ' (LogID: ' + logId + ')' : '';
              var date = 'Date: ' + util.toLocaleString(new Date(log.date)) + logId + '\r\n';
              var hide = (log.hide || (level && !hide && log.level !== level)) ? ' hide' : '';
              return (
                <li key={log.id} title={log.level.toUpperCase()} className={'w-' + log.level + hide}>
                  <pre>
                    {date}
                    {parseLog(log, expandRoot)}
                  </pre>
                </li>
              );
            })}
          </ul>
        </div>
        <FilterInput onChange={this.onConsoleFilterChange} />
      </div>
    );
  }
});

module.exports = Console;
