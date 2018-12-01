require('./base-css.js');
require('../css/log.css');
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

var MAX_FILE_SIZE = 1024 * 1024 * 2;

var allLogs = {
  value: '',
  text: 'All logs'
};

function parseLog(log) {
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
      return <JSONTree data={data} />;
    });
    return log.view;
  } catch(e) {}
  return <ExpandCollapse text={log.text} />;
}

var Console = React.createClass({
  getInitialState: function() {
    return { scrollToBottom: true, logIdList: [allLogs] };
  },
  componentDidMount: function() {
    var self = this;
    var container = this.container = ReactDOM.findDOMNode(self.refs.container);
    var content = this.content = ReactDOM.findDOMNode(self.refs.logContent);
    var updateLogs = function(logs) {
      var curLogs = self.state.logs;
      if (curLogs !== logs && Array.isArray(curLogs)) {
        logs.push.apply(logs, curLogs);
      }
      self.state.logs = logs;
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(container, content);
      if (atBottom) {
        var len = logs.length - 100;
        if (len > 9) {
          logs.splice(0, len);
        }
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
        var overflow = curLogs.length - 80;
        if (overflow > 0) {
          curLogs.splice(80, overflow);
        }
      } else {
        curLogs = logs;
      }
      updateLogs(curLogs);
    });
    dataCenter.on('log', updateLogs);
    var timeout;
    $(container).on('scroll', function() {
      var data = self.state.logs;
      timeout && clearTimeout(timeout);
      if (data && (self.state.scrollToBottom = util.scrollAtBottom(container, content))) {
        timeout = setTimeout(function() {
          var len = data.length - 80;
          if (len > 9) {
            data.splice(0, len);
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
      return alert('The file size can not exceed 2m.');
    }
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function(){
      var logs = util.parseLogs(this.result);
      if (!logs) {
        return;
      }
      events.trigger('uploadLogs', {logs: logs});
    };
    ReactDOM.findDOMNode(this.refs.importData).value = '';
  },
  changeLogId: function(option) {
    dataCenter.changeLogId(option.value);
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
    this.setState({
      consoleKeyword: util.parseKeyword(keyword)
    });
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
    var logs = this.state.logs.map(function(log) {
      return {
        id: log.id,
        text: log.text,
        level: log.level,
        date: log.date
      };
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
  render: function() {
    var state = this.state;
    var logs = state.logs || [];
    var consoleKeyword = state.consoleKeyword;
    var logIdList = state.logIdList;
    var disabled = !logs.length;

    return (
      <div className={'fill orient-vertical-box w-textarea w-detail-page-log' + (this.props.hide ? ' hide' : '')}>
        <div className="w-log-action-bar">
          <DropDown
            onBeforeShow={this.onBeforeShow}
            help="https://avwo.github.io/whistle/webui/log.html"
            onChange={this.changeLogId}
            options={logIdList}
          />
          <div className="w-textarea-bar">
            <a className="w-import" onClick={this.selectFile}
              href="javascript:;" draggable="false">Import</a>
            <a className={'w-download' + (disabled ? ' w-disabled' : '')} onDoubleClick={disabled ? undefined : this.download}
              onClick={disabled ? undefined : this.showNameInput} href="javascript:;" draggable="false">Export</a>
            <a className={'w-auto-refresh' + (disabled ? ' w-disabled' : '')} onDoubleClick={disabled ? undefined : this.stopAutoRefresh}
              onClick={disabled ? undefined : this.autoRefresh} href="javascript:;" draggable="false">AutoRefresh</a>
            <a className={'w-clear' + (disabled ? ' w-disabled' : '')} onClick={disabled ? undefined : this.clearLogs} href="javascript:;" draggable="false">Clear</a>
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
              var date = 'Date: ' + (new Date(log.date)).toLocaleString() + logId + '\r\n';
              var hide = '';
              if (consoleKeyword) {
                var level = consoleKeyword.level;
                if (level && log.level !== level) {
                  hide = ' hide';
                } else {
                  hide = util.checkLogText(date + log.text, consoleKeyword);
                }
              }
              return (
                <li key={log.id} title={log.level.toUpperCase()} className={'w-' + log.level + hide}>
                  <pre>
                    {date}
                    {parseLog(log)}
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
