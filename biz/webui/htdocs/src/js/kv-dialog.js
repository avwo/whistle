require('./base-css.js');
require('../css/kv.css');
var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var events = require('./events');
var win = require('./win');

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
    var self = this;
    self.state.list.forEach(function(item) {
      hasConflict = hasConflict || item.isConflict;
      data[item.name] = item.value;
    });
    if (!hasConflict) {
      return events.trigger(self.isValues ? 'uploadValues' : 'uploadRules', data);
    }
    win.confirm('Conflict with existing content, whether to continue to overwrite them?', function(sure) {
      sure && events.trigger(self.isValues ? 'uploadValues' : 'uploadRules', data);
    });
  },
  remove: function(item) {
    var self = this;
    win.confirm('Are you sure to delete \'' + item.name + '\'.', function(sure) {
      if (sure) {
        var index = self.state.list.indexOf(item);
        if (index !== -1) {
          self.state.list.splice(index, 1);
          self.setState({});
        }
      }
    });
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
