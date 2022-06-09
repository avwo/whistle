require('./base-css.js');
require('../css/list-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var Dialog = require('./dialog');

var ListDialog = React.createClass({
  getInitialState: function () {
    return {
      checkedItems: {},
      selectedCount: 0
    };
  },
  onChange: function (e) {
    var target = e.target;
    var name = target.parentNode.title;
    var checkedItems = this.state.checkedItems;
    if (target.checked) {
      checkedItems[name] = 1;
    } else {
      delete checkedItems[name];
    }
    this.setState({ selectedCount: Object.keys(checkedItems).length });
  },
  onConfirm: function (e) {
    if (e.target.disabled) {
      return;
    }
    this.refs.dialog.hide();
    var input = ReactDOM.findDOMNode(this.refs.filename);
    var form = ReactDOM.findDOMNode(this.refs.exportData);
    var exportAll = e.target.className.indexOf('btn-warning') !== -1;
    var items = exportAll ? this.getAllItems() : this.state.checkedItems;
    ReactDOM.findDOMNode(this.refs.exportName).value = input.value.trim();
    ReactDOM.findDOMNode(this.refs.data).value = JSON.stringify(items);
    form.submit();
    input.value = '';
  },
  getAllItems: function () {
    var list = this.props.list || [];
    var result = {};
    list.forEach(function (name) {
      result[name] = 1;
    });
    return result;
  },
  show: function () {
    var self = this;
    self.refs.dialog.show();
    setTimeout(function () {
      ReactDOM.findDOMNode(self.refs.filename).focus();
    }, 500);
  },
  preventDefault: function (e) {
    e.preventDefault();
  },
  render: function () {
    var self = this;
    var list = self.props.list || [];
    var checkedItems = self.state.checkedItems;
    var selectedCount = self.state.selectedCount;
    var pageName = this.props.name;

    return (
      <Dialog ref="dialog" wclassName=" w-list-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <p>
            Filename:
            <input
              ref="filename"
              style={{ width: 390, display: 'inline-block', marginLeft: 5 }}
              className="form-control"
              placeholder="Input the filename"
            />
          </p>
          {list.map(function (name) {
            return (
              <label title={name}>
                <input
                  onChange={self.onChange}
                  type="checkbox"
                  checked={!!checkedItems[name]}
                />
                {util.isGroup(name) ? <span className="glyphicon glyphicon-triangle-right w-list-group-icon" /> : null}
                {name}
              </label>
            );
          })}
        </div>
        <div className="modal-footer">
          <div className="w-list-counter">
            Selected: {selectedCount} / {list.length}
          </div>
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-warning"
            onMouseDown={this.preventDefault}
            onClick={this.onConfirm}
          >
            Export All
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!Object.keys(checkedItems).length}
            onMouseDown={this.preventDefault}
            onClick={this.onConfirm}
          >
            Export Selected
          </button>
        </div>
        <form
          action={'cgi-bin/' + pageName + '/export'}
          ref="exportData"
          style={{ display: 'none' }}
          target="downloadTargetFrame"
        >
          <input ref="exportName" type="hidden" name="filename" />
          <input ref="data" type="hidden" name={pageName} />
        </form>
      </Dialog>
    );
  }
});

module.exports = ListDialog;
