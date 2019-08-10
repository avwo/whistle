require('./base-css.js');
require('../css/kv.css');
var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var events = require('./events');

var KVDialog = React.createClass({
  getInitialState: function() {
    return { list: [] };
  },
  show: function(data, rulesModal, valuesModal, isValues) {
    data = data || '';
    var list = [];
    this.isValues = isValues;
    Object.keys(data).forEach(function(name) {
      var value = data[name];
      if (value == null) {
        return;
      }
      if (isValues) {
        if (typeof value === 'object') {
          try {
            value = JSON.stringify(value, null, '  ');
          } catch(e) {
            return;
          }
        } else {
          value = value + '';
        }
      }if (typeof value !== 'string') {
        return;
      }
      var modal = isValues ? valuesModal : rulesModal;
      var isConfict;
      var item = modal.get(name);
      if (item) {
        isConfict = item.value && item.value != value;
      }
      list.push({
        name: name,
        value: value,
        isConfict: isConfict
      });
    });
    this.refs.kvDialog.show();
    this._hideDialog = false;
    this.setState({ list: list });
  },
  hide: function() {
    this.refs.kvDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function() {
    return this._hideDialog === false;
  },
  viewContent: function(e) {
    util.openEditor(e.target.title);
  },
  confirm: function() {
    var data = {};
    var hasConfict;
    this.state.list.forEach(function(item) {
      hasConfict = hasConfict || item.isConfict;
      data[item.name] = item.value;
    });
    if (!hasConfict || confirm('Conflict with existing content, whether to continue to overwrite them?')) {
      events.trigger(this.isValues ? 'uploadValues' : 'uploadRules', data);
    }
  },
  remove: function(item) {
    if (!confirm('Are you sure to delete \'' + item.name + '\'.')) {
      return;
    }
    var index = this.state.list.indexOf(item);
    if (index !== -1) {
      this.state.list.splice(index, 1);
      this.setState({});
    }
  },
  render: function() {
    var self = this;
    var list = self.state.list || [];
    var noData = !list.length;
    return (
      <Dialog ref="kvDialog" wstyle="w-kv-dialog">
          <div className="modal-body">
            <button type="button" className="close" onClick={self.hide}>
              <span aria-hidden="true">&times;</span>
            </button>
             <table className="table">
              <thead>
                <th className="w-kv-name">Name</th>
                <th className="w-kv-operation">Operation</th>
              </thead>
              <tbody>
                {
                  noData ? (
                    <tr>
                      <td colSpan="2" className="w-empty">No Data</td>
                    </tr>
                  ) : list.map(function(item, i) {
                    return (
                      <tr className={item.isConfict ? 'w-kv-conflict' : undefined}>
                        <th title={item.name}
                          className="w-kv-name">{item.name}</th>
                        <td className="w-kv-operation">
                          <a href="javascript:;" title={item.value} onClick={self.viewContent}>Content</a>
                          <a href="javascript:;" data-name={item.name} onClick={function() {
                            self.remove(item);
                          }}>Delete</a>
                          <strong>{item.isConfict ? '[Conflict]' : ''}</strong>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
             </table>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" disabled={noData} onClick={this.confirm} data-dismiss="modal">Confirm</button>
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </Dialog>
    );
  }
});

module.exports = KVDialog;
