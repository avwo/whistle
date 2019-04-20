var React = require('react');
var Dialog = require('./dialog');
var JSONView = require('./json-viewer');

var JSONDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  show: function(text) {
    if (!text) {
      return;
    }
    var self = this;
    this.setState({data: {str: text, json: {a: 123}}}, function() {
      self.refs.jsonDialog.show();
    });
  },
  render: function() {
    return (
      <Dialog ref="jsonDialog" wstyle="w-text-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="orient-vertical-box" style={{width: 720, height: 520, marginTop: 22}}>
            <JSONView data={this.state.data} viewSource={true} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

var JSONDialogWrap = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(text) {
    this.refs.jsonDialog.show(text);
  },
  render: function() {
    return <JSONDialog ref="jsonDialog" />;
  }
});

module.exports = JSONDialogWrap;
