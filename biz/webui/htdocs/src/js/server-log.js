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
    return {};
  },
  componentDidMount: function() {
    var self = this;
    var svrContainer = this.container = ReactDOM.findDOMNode(self.refs.svrContainer);
    var svrContent = this.content = ReactDOM.findDOMNode(self.refs.svrContent);
    document.cookie = '_logComponentDidMount=1';
    dataCenter.on('log', function(logs, svrLogs) {
      self.state.svrLogs = svrLogs;
      if (self.props.hide) {
        return;
      }
      var atBottom = util.scrollAtBottom(svrContainer, svrContent);
      if (atBottom) {
        var len = svrLogs.length - 110;
        if (len > 9) {
          svrLogs.splice(0, len);
        }
      }
      self.state.atSvrLogBottom = atBottom;
      self.setState({}, function() {
        if (atBottom) {
          svrContainer.scrollTop = svrContent.offsetHeight;
        }
      });
    });

    var svrTimeout;
    $(svrContainer).on('scroll', function() {
      var data = self.state.svrLogs;
      svrTimeout && clearTimeout(svrTimeout);
      if (data && (self.state.atSvrLogBottom = util.scrollAtBottom(svrContainer, svrContent))) {
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
    var data = this.state.svrLogs;
    data && data.splice(0, data.length);
    this.setState({});
  },
  autoRefresh: function() {
    var self = this;
    var container = ReactDOM.findDOMNode(self.refs.svrContainer);
    var content = ReactDOM.findDOMNode(self.refs.svrContent);
    container.scrollTop = content.offsetHeight;
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    if (hide != util.getBoolean(nextProps.hide) || !hide) {
      this.scrollToBottom = util.scrollAtBottom(this.container, this.content);
      return true;
    }
    return false;
  },
  componentDidUpdate: function() {
    if (this.scrollToBottom) {
      this.container.scrollTop = 1000000;
    }
  },
  toggleTabs: function(btn) {
    this.setState({}, function() {
      var container, content;
      if (this.state.atSvrLogBottom !== false) {
        container = ReactDOM.findDOMNode(this.refs.svrContainer);
        content = ReactDOM.findDOMNode(this.refs.svrContent);
        container.scrollTop = content.offsetHeight;
      }
    });
  },
  onServerFilterChange: function(keyword) {
    this.setState({
      serverKeyword: util.parseKeyword(keyword)
    });
  },
  render: function() {
    var state = this.state;
    var svrLogs = state.svrLogs || [];
    var serverKeyword = state.serverKeyword;

    return (
      <div className={'fill orient-vertical-box w-detail-svr-log' + (this.props.hide ? ' hide' : '')}>
        <div ref="svrContainer" className="fill w-detail-log-content">
          <ul ref="svrContent">
            {svrLogs.map(function(log) {
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
