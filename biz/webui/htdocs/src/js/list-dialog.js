require('./base-css.js');
require('../css/list-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');

var ListDialog = React.createClass({
  getInitialState: function() {
    return {
      checkedItems: {}
    };
  },
  onChange: function(e) {
    var target = e.target;
    var name = target.parentNode.title;
    var checkedItems = this.state.checkedItems;
    if (target.checked) {
      checkedItems[name] = 1;
    } else {
      delete checkedItems[name];
    }
    this.setState({});
  },
  onConfirm: function(e) {
    if (e.target.disabled) {
      return;
    }
    this.refs.dialog.hide();
    var input = ReactDOM.findDOMNode(this.refs.filename);
    var filename = '&filename=' + encodeURIComponent(input.value.trim());
    var form = ReactDOM.findDOMNode(this.refs.exportData);
    form.action = this.props.url + encodeURIComponent(JSON.stringify(this.state.checkedItems)) + filename;
    form.submit();
    input.value = '';
  },
  show: function() {
    var self = this;
    self.refs.dialog.show();
    setTimeout(function() {
      ReactDOM.findDOMNode(self.refs.filename).focus();
    }, 500);
  },
  render: function() {
    var self = this;
    var list = self.props.list || [];
    var checkedItems = self.state.checkedItems;

    return (
      <Dialog ref="dialog" wclassName=" w-list-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <p>
            Filename:
            <input ref="filename"
              style={{width: 390, display: 'inline-block', marginLeft: 5}}
              className="form-control"
              placeholder="Input the filename"
            />
          </p>
          {list.map(function(name) {
            return (
              <label title={name}>
                <input
                  onChange={self.onChange}
                  type="checkbox"
                  checked={!!checkedItems[name]}
                   />
                {name}
              </label>
            );
          })}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
          <button type="button" className="btn btn-primary"
            disabled={!Object.keys(checkedItems).length}
            onMouseDown={function(e) {
              e.preventDefault();
            }}
            onClick={this.onConfirm}>Confirm</button>
        </div>
        <form ref="exportData" style={{display: 'none'}} target="downloadTargetFrame" />
      </Dialog>
    );
  }
});

module.exports = ListDialog;
