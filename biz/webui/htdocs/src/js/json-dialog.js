var React = require('react');
var Dialog = require('./dialog');
var JSONView = require('./json-viewer');
var util = require('./util');

var JSONDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (text) {
    if (!text) {
      return;
    }
    var self = this;
    var data = this.state.data;
    if (data && data.text === text) {
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
    this.setState({ data: data }, function () {
      self.refs.jsonDialog.show();
    });
  },
  render: function () {
    return (
      <Dialog ref="jsonDialog" wstyle="w-json-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div
            className="orient-vertical-box"
            style={{ width: 720, height: 520, marginTop: 22 }}
          >
            <JSONView data={this.state.data} viewSource={true} />
          </div>
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
