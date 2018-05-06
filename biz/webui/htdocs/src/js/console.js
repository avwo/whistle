require('./base-css.js');
require('../css/log.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var JSONTree = require('react-json-tree')['default'];
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');

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
        return <span>{hasNonStr ? '"' + data + '"' : data}</span>;
      }
      if (!data || typeof data !== 'object') {
        return <span style={{color: 'rgb(203, 75, 22)'}}>{data + ''}</span>;
      }
      return <JSONTree data={data} />;
    });
    return log.view;
  } catch(e) {}
  return log.text;
}

var Console = React.createClass({
  getInitialState: function() {
    return { scrollToBottom: true };
  },
  componentDidMount: function() {
    var self = this;
    var container = this.container = ReactDOM.findDOMNode(self.refs.container);
    var content = this.content = ReactDOM.findDOMNode(self.refs.logContent);
    dataCenter.on('log', function(logs) {
      self.state.logs = logs;
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(container, content);
      if (atBottom) {
        var len = logs.length - 80;
        if (len > 9) {
          logs.splice(0, len);
        }
      }
      self.setState({});
    });
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
  render: function() {
    var state = this.state;
    var logs = state.logs || [];
    var consoleKeyword = state.consoleKeyword;

    return (
      <div className={'fill orient-vertical-box w-textarea w-detail-page-log' + (this.props.hide ? ' hide' : '')}>
        <div className={'w-log-action-bar' + (logs.length ? '' : ' hide')}>
        <div className="dropdown w-dropdown">
          <div className="dropdown-toggle w-dropdown-text">
            All Logs
            <span className="caret"></span>
          </div>
          <ul onClick={this.changeLogId} className="dropdown-menu">
            <li>All Logs</li>
            <li>Action</li>
            <li>ActionActionActionAction</li>
            <li>Action</li>
            <li role="separator" className="divider"></li>
            <li>
              <a
                href="https://avwo.github.io/whistle/webui/log.html"
                target="_blank"
              >
                Help
              </a>
            </li>
          </ul>
        </div>
          <div className="w-textarea-bar">
            <a className="w-download" onDoubleClick={this.download}
              onClick={this.showNameInput} href="javascript:;" draggable="false">Download</a>
            <a className="w-auto-refresh" onDoubleClick={this.stopAutoRefresh}
              onClick={this.autoRefresh} href="javascript:;" draggable="false">AutoRefresh</a>
            <a className="w-clear" onClick={this.clearLogs} href="javascript:;" draggable="false">Clear</a>
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
              <input ref="filename" name="filename" type="hidden" />
              <input ref="content" name="content" type="hidden" />
            </form>
          </div>
        </div>
        <div ref="container" className="fill w-detail-log-content">
          <ul ref="logContent">
            {logs.map(function(log) {
              var date = 'Date: ' + (new Date(log.date)).toLocaleString() + '\r\n';
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
