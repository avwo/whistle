require('../css/kv.css');
var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var events = require('./events');
var win = require('./win');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var KVDialog = React.createClass({
  getInitialState: function () {
    return { list: [], history: [] };
  },
  show: function (data, rulesModal, valuesModal, isValues, selectedHistory) {
    this.isValues = isValues;
    this.refs.kvDialog.show();
    this._hideDialog = false;
    var history = [];
    var hideDefaultOption = data && data.hideDefaultOption;
    if (data && Array.isArray(data.list) && typeof data.data === 'object') {
      var count = 0;
      data.list.forEach(function(name) {
        if (name && count < 360 && typeof name === 'string' && name.length <= 256) {
          ++count;
          history.push(name);
        }
      });
      if (data.selected) {
        selectedHistory = history.indexOf(data.selected) === -1 ? '' : data.selected;
      }
      data = data.data;
    }
    var modal = isValues ? valuesModal : rulesModal;
    this.setState({
      hideDefaultOption: hideDefaultOption,
      selectedHistory: history.indexOf(selectedHistory) === -1 ? (hideDefaultOption ? history[0] : '') : selectedHistory,
      history: history,
      modal: modal,
      list: util.parseImportData(
        data || '',
        modal,
        isValues
      )
    });
  },
  hide: function () {
    this.refs.kvDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  selectHistory: function(e) {
    var onHistoryChange = this.props.onHistoryChange;
    onHistoryChange && onHistoryChange(e.target.value, this.isValues);
  },
  viewContent: function (e) {
    util.openEditor(e.target.title);
  },

  export: function () {
    var data = {};
    var list = [];
    this.state.list.forEach(function (item) {
      if (item.checked) {
        data[item.name] = item.value;
        list.push(item.name);
      }
    });
    data[''] = list;
    util.download(data, (this.isValues ? 'values_' : 'rules_') + util.formatDate() + '.txt');
  },
  confirm: function () {
    var data = {};
    var list = [];
    var hasConflict;
    var self = this;
    self.state.list.forEach(function (item) {
      if (item.checked) {
        hasConflict = hasConflict || item.isConflict;
        data[item.name] = item.value;
        list.push(item.name);
      }
    });
    data[''] = list;
    var save = function() {
      self.hide();
      return events.trigger(self.isValues ? 'uploadValues' : 'uploadRules', data);
    };
    if (!hasConflict) {
      return save();
    }
    win.confirm(
      'Content conflict detected. Overwrite existing content?',
      function (sure) {
        if (sure) {
          save();
        }
      }
    );
  },
  checkAll: function (e) {
    var list = this.state.list;
    if (!list || !list.length) {
      return;
    }
    var checked = e.target.checked;
    list.forEach(function (item) {
      item.checked = checked;
    });
    this.setState({ list: list });
  },
  checkItem: function(e, item) {
    item.checked = e.target.checked;
    this.setState({});
  },
  render: function () {
    var self = this;
    var state = self.state;
    var list = state.list || [];
    var history = state.history;
    var selectedHistory = state.selectedHistory || '';
    var len = list.length;
    var noData = !len;
    var checkedCount = 0;
    var modal = state.modal;
    var hideDefaultOption = state.hideDefaultOption;
    var checkedAll = !noData && list.every(function (item) {
      return item.checked;
    });
    var title = self.isValues ? 'Values' : 'Rules';

    return (
      <Dialog ref="kvDialog" wstyle="w-kv-dialog">
        <div className="modal-header">
          <h4>Select {title}</h4>
          <CloseBtn onClick={self.hide} />
        </div>
        <div className="modal-body">
          {history.length ? <label>
            History:
            <select
              value={selectedHistory}
              onChange={this.selectHistory}
              className="form-control w-history-record-list"
            >
              {hideDefaultOption ? null : <option value="">
                Select history
              </option>}
              {
                history.map(function(item, i) {
                  return (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  );
                })
              }
            </select>
          </label> : undefined}
          <table className="table">
            <thead>
              <th className="w-kv-box"><input type="checkbox" checked={checkedAll} onChange={self.checkAll} disabled={noData} /></th>
              <th className="w-kv-name">
                Name
              </th>
              <th className="w-kv-operation">Content</th>
            </thead>
            <tbody className="w-hover-body">
              {noData ? (
                <tr>
                  <td colSpan="3" className="w-empty">
                    Empty
                  </td>
                </tr>
              ) : (
                list.map(function (item, i) {
                  var isGroup = util.isGroup(item.name);
                  var value = typeof item.value === 'string' ? item.value : '';
                  var exceed = value.length > 128;
                  if (item.checked) {
                    ++checkedCount;
                  }
                  var curValue;
                  var showConflict = item.isConflict && !isGroup;
                  if (showConflict) {
                    var oldItem = modal && modal.get(item.name);
                    curValue = oldItem && oldItem.value;
                    if (curValue) {
                      curValue = '<<<<<<<<<<< <<<<<<<<<<< <<<<<<<<<<< OLD <<<<<<<<<<< <<<<<<<<<<< <<<<<<<<<<<\n\n' +
                      curValue + '\n\n=========== ========== ========== BOUNDARY ========== ========== ==========\n\n' +
                      value + '\n\n>>>>>>>>>>> >>>>>>>>>>> >>>>>>>>>>> NEW >>>>>>>>>>> >>>>>>>>>>> >>>>>>>>>>>';
                    }
                  }

                  return (
                    <tr
                      key={i}
                      className={item.isConflict ? 'w-kv-conflict' : undefined}
                    >
                      <th className="w-kv-box"><input type="checkbox" checked={item.checked} onChange={function(e) {
                        self.checkItem(e, item);
                      }} /></th>
                      <td title={item.name} className="w-kv-name">
                        {isGroup ? <Icon name="triangle-right" className="w-list-group-icon" /> : null}{item.name}
                        {showConflict ? <strong onClick={self.viewContent} title={curValue}>[Conflict]</strong> : null}
                      </td>
                      <td className="w-kv-operation">
                        <pre>
                          {exceed ? value.substring(0, 100) + '...' : value}
                        </pre>
                        {exceed ? <a title={value} onClick={self.viewContent}>
                            View all
                          </a> : null }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <label className="w-kv-check-all">
            <input type="checkbox" checked={checkedAll} onChange={self.checkAll} disabled={noData} />
            Select all
          </label>
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-default"
            disabled={!checkedCount}
            onClick={this.export}
          >
            Export Selected
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!checkedCount}
            onClick={this.confirm}
          >
            Add To {title} {len ? ' (' + checkedCount + ' / ' + len + ')' : null}
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = KVDialog;
