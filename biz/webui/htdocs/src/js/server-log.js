require('./base-css.js');
require('../css/log.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');

var ServerLog = React.createClass({
  getInitialState: function() {
    return { scrollToBottom: true };
  },
  componentDidMount: function() {
    var self = this;
    var svrContainer = this.container = ReactDOM.findDOMNode(self.refs.svrContainer);
    var svrContent = this.content = ReactDOM.findDOMNode(self.refs.svrContent);
    dataCenter.on('log', function(logs, svrLogs) {
      self.state.logs = svrLogs;
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(svrContainer, svrContent);
      if (atBottom) {
        var len = svrLogs.length - 50;
        if (len > 9) {
          svrLogs.splice(0, len);
        }
      }
      self.setState({});
    });

    var svrTimeout;
    $(svrContainer).on('scroll', function() {
      var data = self.state.logs;
      svrTimeout && clearTimeout(svrTimeout);
      if (data && (self.state.scrollToBottom = util.scrollAtBottom(svrContainer, svrContent))) {
        svrTimeout = setTimeout(function() {
          var len = data.length - 50;
          if (len > 9) {
            data.splice(0, len);
            self.setState({});
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
  stopAutoRefresh: function() {
    if (util.scrollAtBottom(this.container, this.content)) {
      this.container.scrollTop = this.container.scrollTop - 10;
    }
  },
  scrollTop: function() {
    this.container.scrollTop = 0;
  },
  autoRefresh: function() {
    this.container.scrollTop = 10000000;
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
  onServerFilterChange: function(keyword) {
    this.setState({
      serverKeyword: util.parseKeyword(keyword)
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
    var serverKeyword = state.serverKeyword;

    return (
      <div className={'fill orient-vertical-box w-textarea w-detail-svr-log' + (this.props.hide ? ' hide' : '')}>
        <div className={'w-log-action-bar' + (logs.length ? '' : ' hide')}>
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
        <div ref="svrContainer" className="fill w-detail-log-content">
          <ul ref="svrContent">
            {logs.map(function(log) {
              var text = 'Date: ' + (new Date(log.date)).toLocaleString() + '\r\n' + log.text;
              var hide = '';
              if (serverKeyword) {
                var level = serverKeyword.level;
                if (level && log.level !== level) {
                  hide = ' hide';
                } else {
                  hide = util.checkLogText(text, serverKeyword);
                }
              }
              return (
                <li key={log.id} title={log.level.toUpperCase()} className={'w-' + log.level + hide}>
                  <pre>
                    {text}
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
