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
    this.isValues = isValues;
    this.refs.kvDialog.show();
    this._hideDialog = false;
    this.setState({ list: util.parseImportData(data || '', isValues ? valuesModal : rulesModal, isValues) });
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
    var hasConflict;
    this.state.list.forEach(function(item) {
      hasConflict = hasConflict || item.isConflict;
      data[item.name] = item.value;
    });
    if (!hasConflict || confirm('Conflict with existing content, whether to continue to overwrite them?')) {
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
                      <td colSpan="2" className="w-empty">Empty</td>
                    </tr>
                  ) : list.map(function(item, i) {
                    return (
                      <tr className={item.isConflict ? 'w-kv-conflict' : undefined}>
                        <th title={item.name}
                          className="w-kv-name">{item.name}</th>
                        <td className="w-kv-operation">
                          <a title={item.value} onClick={self.viewContent}>Content</a>
                          <a data-name={item.name} onClick={function() {
                            self.remove(item);
                          }}>Delete</a>
                          <strong>{item.isConflict ? '[Conflict]' : ''}</strong>
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
