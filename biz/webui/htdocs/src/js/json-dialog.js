var React = require('react');
var Dialog = require('./dialog');
var JSONView = require('./json-viewer');
var FilterInput = require('./filter-input');
var util = require('./util');

var KV_RE = /^(k|v):/;

var JSONDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  onFilter: function(keyword) {
    keyword = keyword.trim();
    var self = this;
    self._type = 0;
    if (KV_RE.test(keyword)) {
      self._type = RegExp.$1 === 'k' ? 1 : 2;
      keyword = keyword.substring(2);
    }
    clearTimeout(self.filterTimer);
    if (self._keyword !== keyword) {
      self._keyword = keyword;
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
    if (!this._keyword) {
      return;
    }
    var json = util.filterJsonText(data.str, this._keyword, this._type);
    if (!json) {
      return;
    }
    return {
      json: json,
      str: JSON.stringify(json, null, '  ')
    };
  },
  show: function (text) {
    if (!text) {
      return;
    }
    var self = this;
    var data = this.state.data;
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
    this.setState({ curData: this.filterJson(data), data: data }, function () {
      self.refs.jsonDialog.show();
      self.focus();
    });
  },
  focus: function() {
    var self = this;
    setTimeout(function() {
      self.refs.filterInput.focus();
    }, 600);
  },
  render: function () {
    var state = this.state;
    return (
      <Dialog ref="jsonDialog" wstyle="w-json-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div
            className="orient-vertical-box"
            style={{ width: 880, height: 560, marginTop: 22, background: this._keyword ? 'lightyellow' : undefined }}
          >
            <JSONView dialog data={state.curData || state.data} viewSource={true} />
          </div>
          <FilterInput ref="filterInput" onChange={this.onFilter} placeholder=" (as: xxx, k:xxx or v:xxx)" />
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
  show: function (text) {
    this.refs.jsonDialog.show(text);
  },
  render: function () {
    return <JSONDialog ref="jsonDialog" />;
  }
});

module.exports = JSONDialogWrap;
