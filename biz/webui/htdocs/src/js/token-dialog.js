require('../css/online.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var util = require('./util');
var message = require('./message');


var TokenDialog = React.createClass({
  getInitialState: function () {
    return { action: '' };
  },
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (action) {
    var self = this;
    self.setState({ action: action });
    self.refs.tokenDialog.show();
    setTimeout(function () {
      var textarea = ReactDOM.findDOMNode(self.refs.textarea);
      textarea.select();
      textarea.focus();
    }, 600);
  },
  save: function() {
    var token = ReactDOM.findDOMNode(this.refs.textarea).value.trim();
    if (!token) {
      message.error('The token is required');
    }
  },
  render: function () {
    var action = this.state.action;
    var isReset = action === 'reset';

    return (
      <Dialog ref="tokenDialog" wstyle="w-token-dialog">
        <div className="modal-header">
          <h4 className="w-certs-info-title">
            <a
              className="w-help-menu"
              title="Click here to see help"
              href={util.getDocsBaseUrl('faq.html#custom-certs')}
              target="_blank"
            >
              <span className="glyphicon glyphicon-question-sign"></span>
            </a>
            {isReset ? 'Reset Access Token' : 'Set Access Token'}
          </h4>
          <button action="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <textarea ref="textarea" />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
          >
            Get Token
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onMouseDown={util.preventBlur}
            onClick={this.save}
          >
            Save
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = TokenDialog;
