require('./base-css.js');
require('../css/log.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');

var JSONTree = require('react-json-tree')['default'];
var BtnGroup = require('./btn-group');
var util = require('./util');
var dataCenter = require('./data-center');
var FilterInput = require('./filter-input');

var BTNS = [{
  name: 'Console',
  icon: 'file',
  active: true
}, {
  name: 'Server',
  icon: 'exclamation-sign'
}];

function parseKeyword(keyword) {
  keyword = keyword.trim().toLowerCase().split(/\s+/g);
  var result = {};
  var index = 0;
  for (var i = 0; i <= 3; i++) {
    var key = keyword[i];
    if (key && key.indexOf('level:') === 0) {
      result.level = key.substring(6);
    } else if (index < 3) {
      ++index;
      result['key' + index] = key;
    }
  }
  return result;
}

function checkLogText(text, keyword) {
  if (!keyword.key1) {
    return '';
  }
  text = text.toLowerCase();
  if (text.indexOf(keyword.key1) === -1) {
    return ' hide';
  }
  if (keyword.key2 && text.indexOf(keyword.key2) === -1) {
    return ' hide';
  }
  if (keyword.key3 && text.indexOf(keyword.key3) === -1) {
    return ' hide';
  }
  return '';
}

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

var Log = React.createClass({
  componentDidMount: function() {
    var self = this;
    var container = ReactDOM.findDOMNode(self.refs.container);
    var content = ReactDOM.findDOMNode(self.refs.content);
    var svrContainer = ReactDOM.findDOMNode(self.refs.svrContainer);
    var svrContent = ReactDOM.findDOMNode(self.refs.svrContent);
    document.cookie = '_logComponentDidMount=1';
    dataCenter.on('log', function(logs, svrLogs) {
      var isConsole = self.isConsole();
      var atBottom = isConsole ? scrollAtBottom() : scrollAtBottom(svrContainer, svrContent);
      var data = isConsole ? logs : svrLogs;
      if (atBottom) {
        var len = data.length - 110;
        if (len > 10) {
          data.splice(0, len);
        }
      }
      var state = {logs: logs, svrLogs: svrLogs};
      if (isConsole) {
        state.atPageLogBottom = atBottom;
      } else {
        state.atSvrLogBottom = atBottom;
      }
      self.setState(state, function() {
        if (atBottom) {
          if (isConsole) {
            container.scrollTop = content.offsetHeight;
          } else {
            svrContainer.scrollTop = svrContent.offsetHeight;
          }
        }
      });
    });
    var timeout, svrTimeout;
    $(container).on('scroll', function() {
      var data = self.state.logs;
      timeout && clearTimeout(timeout);
      if (data && (self.state.atPageLogBottom = scrollAtBottom())) {
        timeout = setTimeout(function() {
          var len = data.length - 80;
          if (len > 10) {
            data.splice(0, len);
            self.setState({logs: data});
          }
        }, 2000);
      }
    });

    $(svrContainer).on('scroll', function() {
      var data = self.state.svrLogs;
      svrTimeout && clearTimeout(svrTimeout);
      if (data && (self.state.atSvrLogBottom = scrollAtBottom(svrContainer, svrContent))) {
        svrTimeout = setTimeout(function() {
          var len = data.length - 80;
          if (len > 10) {
            data.splice(0, len);
            self.setState({});
          }
        }, 2000);
      }
    });

    function scrollAtBottom(con, ctn) {
      con = con || container;
      ctn = ctn || content;
      return con.scrollTop + con.offsetHeight + 5 > ctn.offsetHeight;
    }
  },
  clearLogs: function() {
    var data = this.isConsole() ? this.state.logs : this.state.svrLogs;
    data && data.splice(0, data.length);
    this.setState({});
  },
  autoRefresh: function() {
    var self = this;
    var container = ReactDOM.findDOMNode(self.isConsole() ? self.refs.container : self.refs.svrContainer);
    var content = ReactDOM.findDOMNode(self.isConsole() ? self.refs.content : self.refs.svrContent);
    container.scrollTop = content.offsetHeight;
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  toggleTabs: function(btn) {
    this.setState({}, function() {
      var container, content;
      if (this.isConsole()) {
        if (this.state.atPageLogBottom !== false) {
          container = ReactDOM.findDOMNode(this.refs.container);
          content = ReactDOM.findDOMNode(this.refs.content);
          container.scrollTop = content.offsetHeight;
        }
      } else {
        if (this.state.atSvrLogBottom !== false) {
          container = ReactDOM.findDOMNode(this.refs.svrContainer);
          content = ReactDOM.findDOMNode(this.refs.svrContent);
          container.scrollTop = content.offsetHeight;
        }
      }
    });
  },
  isConsole: function() {
    return BTNS[0].active;
  },
  onConsoleFilterChange: function(keyword) {
    this.setState({
      consoleKeyword: parseKeyword(keyword)
    });
  },
  onServerFilterChange: function(keyword) {
    this.setState({
      serverKeyword: parseKeyword(keyword)
    });
  },
  render: function() {
    var state = this.state || {};
    var logs = state.logs || [];
    var svrLogs = state.svrLogs || [];
    var isConsole = this.isConsole();
    var hasLogs = isConsole ? logs.length : svrLogs.length;
    var consoleKeyword = state.consoleKeyword;
    var serverKeyword = state.serverKeyword;

    return (
        <div className={'fill orient-vertical-box w-detail-log' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
          <div style={{display: hasLogs ? 'block' : 'none'}} className="w-detail-log-bar">
            <a className="w-auto-scroll-log" href="javascript:;" draggable="false" onClick={this.autoRefresh}>AutoRefresh</a>
            <a className="w-clear-log" href="javascript:;" draggable="false" onClick={this.clearLogs}>Clear</a>
          </div>
          <BtnGroup onClick={this.toggleTabs}  onDoubleClick={this.clearLogs} btns={BTNS} />
          <div className={'fill orient-vertical-box w-detail-page-log' + (isConsole ? '' : ' hide')}>
            <div ref="container" className="fill w-detail-log-content">
              <ul ref="content">
                {logs.map(function(log) {
                  var date = 'Date: ' + (new Date(log.date)).toLocaleString() + '\r\n';
                  var hide = '';
                  if (consoleKeyword) {
                    var level = consoleKeyword.level;
                    if (level && log.level !== level) {
                      hide = ' hide';
                    } else {
                      hide = checkLogText(date + log.text, consoleKeyword);
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
          <div className={'fill orient-vertical-box w-detail-svr-log' + (!isConsole ? '' : ' hide')}>
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
                      hide = checkLogText(text, serverKeyword);
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
      </div>
    );
  }
});

module.exports = Log;
