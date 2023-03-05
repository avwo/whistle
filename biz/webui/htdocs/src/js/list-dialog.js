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
  show: function (selectedList) {
    var self = this;
    self.refs.dialog.show();
    if (selectedList) {
      if (selectedList && typeof selectedList === 'string') {
        selectedList = [selectedList];
      }
      var checkedItems = {};
      if (Array.isArray(selectedList)) {
        var list = self.props.list || [];
        selectedList.forEach(function(name) {
          if (list.indexOf(name) !== -1) {
            checkedItems[name] = 1;
          }
        });
      }
      self.setState({ checkedItems: checkedItems });
    }
    !this.props.onConfirm && setTimeout(function () {
      ReactDOM.findDOMNode(self.refs.filename).focus();
    }, 500);
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  preventDefault: function (e) {
    e.preventDefault();
  },
  render: function () {
    var self = this;
    var state = self.state;
    var props = self.props;
    var list = props.list || [];
    var checkedItems = state.checkedItems;
    var selectedCount = state.selectedCount;
    var pageName = props.name;
    var checkedNames = Object.keys(checkedItems);
    var hasChecked = checkedNames.length;
    var tips = hasChecked ? props.tips : null;
    var onConfirm = props.onConfirm;
    var isRules = props.isRules;

    return (
      <Dialog ref="dialog" wclassName=" w-list-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <div className="w-list-wrapper">
            {list.map(function (name, i) {
              if (!i && isRules) {
                return;
              }
              return (
                <label title={name} key={name}>
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
          {tips ? <h5 className="w-list-tips-title">{tips}</h5> : null}
          {tips ? <div className="w-list-tips">
            {
              checkedNames.map(function(name) {
                return (
                  <span key={name}>
                    {util.isGroup(name) ? <span className="glyphicon glyphicon-triangle-right w-list-group-icon" /> : null}
                    {name}
                  </span>
                );
              })
            }
          </div> : (onConfirm ? null : <p style={{marginTop: 10}}>
              Filename:
              <input
                ref="filename"
                style={{ width: 390, display: 'inline-block', marginLeft: 5 }}
                className="form-control"
                placeholder="Input the filename"
              />
            </p>)}
        </div>
        <div className="modal-footer">
          {
            onConfirm ? null : <div className="w-list-counter">
              Selected: {selectedCount} / {list.length}
            </div>
          }
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          {onConfirm ? null : <button
            type="button"
            className="btn btn-warning"
            onMouseDown={this.preventDefault}
            onClick={this.onConfirm}
          >
            Export All
          </button>}
          <button
            type="button"
            className="btn btn-primary"
            disabled={!hasChecked}
            onMouseDown={this.preventDefault}
            onClick={onConfirm ? function() {
              onConfirm(checkedNames);
            } : this.onConfirm}
          >
            {onConfirm ? 'Confirm' : 'Export Selected'}
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
