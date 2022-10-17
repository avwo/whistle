var React = require('react');
var Dialog = require('./dialog');
var Textarea = require('./textarea');

var TextDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  show: function (value, base64, name) {
    if (value) {
      var self = this;
      self.setState({ value: value, base64: base64, name: name }, function () {
        self.refs.textDialog.show();
      });
    }
  },
  render: function () {
    var state = this.state;
    var value = state.value;
    return (
      <Dialog ref="textDialog" wstyle="w-text-dialog">
        <div className="modal-body">
          <button type="button" className="btn-close" data-bs-dismiss="modal">

          </button>
          <div
            className="orient-vertical-box"
            style={{ width: 860, height: 560, marginTop: 22 }}
          >
            <Textarea
              className="fill"
              value={value}
              base64={state.base64}
              defaultName={state.name}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={value}
          >
            Copy
          </button>
          <button
            type="button"
            className="btn btn-default"
            data-bs-dismiss="modal"
          >
            Close
          </button>
        </div>
      </Dialog>
    );
  }
});

var TextDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (value, base64, name) {
    this.refs.textDialog.show(value, base64, name);
  },
  render: function () {
    return <TextDialog ref="textDialog" />;
  }
});

module.exports = TextDialogWrap;
