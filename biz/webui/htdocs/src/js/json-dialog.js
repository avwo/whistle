var React = require('react');
var Dialog = require('./dialog');
var JSONView = require('./json-viewer');
var FilterInput = require('./filter-input');
var util = require('./util');
var FbBtn = require('./forward-back-btn');
var CloseBtn = require('./close-btn');

var KV_RE = /^(k|v):/;

var JSONDialog = React.createClass({
  getInitialState: function () {
    return { history: [] };
  },
  onFilter: function(keyword) {
    keyword = keyword.trim();
    var self = this;
    self._type = 0;
    var not = keyword[0] === '!';
    if (not) {
      keyword = keyword.substring(1).trim();
    }
    if (KV_RE.test(keyword)) {
      self._type = RegExp.$1 === 'k' ? 1 : 2;
      keyword = keyword.substring(2);
    }
    clearTimeout(self.filterTimer);
    if (self._keyword !== keyword || self._not !== not) {
      self._keyword = keyword;
      self._not = not;
      if (self._type && keyword[0] === '!') {
        not = true;
        keyword = keyword.substring(1).trim();
      }
      if (keyword) {
        keyword = {
          not: not,
          keyword: keyword.toLowerCase(),
          regexp: util.toRegExp(keyword)
        };
      }
      self._keywordObj = keyword;
      if (!keyword) {
        return self.setState({ curData: null });
      }
    }
    self.filterTimer = setTimeout(function() {
      var data = self.state.data;
      self.setState({ curData: data && self.filterJson(data) });
    }, 600);
  },
  filterJson: function(data) {
    var self = this;
    if (!self._keywordObj) {
      return;
    }
    var json = util.filterJsonText(data.str, self._keywordObj, self._type);
    if (!json) {
      return;
    }
    return {
      json: json,
      str: JSON.stringify(json, null, '  ')
    };
  },
  show: function(text, keyPath, session) {
    if (!text) {
      return;
    }
    var self = this;
    var state = self.state;
    var history = state.history;
    var historyIndex = state.historyIndex;
    var len = history.length;
    if (historyIndex == null) {
      historyIndex = len - 1;
    }
    var last = historyIndex > -1 && history[historyIndex];
    var keyName = keyPath ? keyPath[0] : null;
    if (!last || last[0] !== text || last[1] !== keyName) {
      ++historyIndex;
      if (historyIndex !== len) {
        history.splice(historyIndex, len - historyIndex);
      }
      history.push([text, keyName]);
      var overLen = historyIndex - 35; // max: 36
      if (overLen > 0) {
        history.splice(0, overLen);
      }
    }
    state.historyIndex = historyIndex;
    self._show(text, keyPath, session);
  },
  _show: function (text, keyPath, session) {
    var self = this;
    var data = self.state.data;
    self.setState({ session: session, keyPath: Array.isArray(keyPath) ? keyPath : null });
    if (data && data.text === text) {
      self.focus();
      return self.refs.jsonDialog.show();
    }
    var json = util.parseJSON(text);
    if (!json && !/[\r\n]/.test(text)) {
      if (!/\s/.test(text) && text.indexOf('&') !== -1) {
        json = util.parseQueryString(text, null, null, decodeURIComponent);
      } else if (text.indexOf(';') !== -1 || text.indexOf('=') !== -1) {
        json = util.parseQueryString(text, ';', null, decodeURIComponent);
      }
    }
    if (json) {
      data = {
        json: json,
        text: text,
        str: JSON.stringify(json, null, '  ')
      };
    } else {
      return util.parseRawJson(text);
    }
    self.setState({ curData: self.filterJson(data), data: data }, function () {
      self.refs.jsonDialog.show();
      self.focus();
    });
  },
  showHistory: function(index) {
    var self = this;
    self.state.historyIndex = index;
    var item = self.state.history[index];
    self._show(item[0], item[1] == null ? null : [item[1]]);
  },
  onBack: function() {
    var self = this;
    var historyIndex = self.state.historyIndex;
    if (historyIndex > 0) {
      self.showHistory(historyIndex - 1);
    }
  },
  onForward: function() {
    var self = this;
    var history = self.state.history;
    var historyIndex = self.state.historyIndex + 1;
    if (historyIndex < history.length) {
      self.showHistory(historyIndex);
    }
  },
  focus: function() {
    var self = this;
    setTimeout(function() {
      self.refs.filterInput.focus();
    }, 600);
  },
  render: function () {
    var self = this;
    var state = self.state;
    var history = state.history;
    var historyIndex = state.historyIndex;

    return (
      <Dialog ref="jsonDialog" wstyle="w-json-dialog">
        <div className="modal-body">
          <FbBtn
            disabledBack={historyIndex <= 0}
            disabledForward={historyIndex >= history.length - 1}
            onBack={self.onBack}
            onForward={self.onForward}
          />
          <CloseBtn />
          <div
            className="v-box"
            style={{ width: 880, height: 560, marginTop: 22, background: self._keywordObj ? 'var(--b-filtered)' : undefined }}
          >
            <JSONView keyPath={state.keyPath} dialog data={state.curData || state.data} viewSource={true} session={state.session} />
          </div>
          <FilterInput ref="filterInput" onChange={self.onFilter} placeholder=" (e.g. xxx or k:xxx or v:xxx)" />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

var JSONDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (text, keyPath, session) {
    this.refs.jsonDialog.show(text, keyPath, session);
  },
  render: function () {
    return <JSONDialog ref="jsonDialog" />;
  }
});

module.exports = JSONDialogWrap;
