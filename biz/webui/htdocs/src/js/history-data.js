require('./base-css.js');
require('../css/composer.css');
var React = require('react');
var Dialog = require('./dialog');

var HistoryData = React.createClass({
  show: function() {
    this.refs.historyDialog.show();
    this._hideDialog = false;
    this.setState({});
  },
  hide: function() {
    this.refs.historyDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function() {
    return this._hideDialog === false;
  },
  render: function() {
    var self = this;
    var data = self.props.data;
    return (
      <Dialog ref="historyDialog" wstyle="w-composer-history-dialog">
          <div className="modal-body w-composer-history">
            <button type="button" className="close" onClick={self.hide}>
              <span aria-hidden="true">&times;</span>
            </button>
             <table className="table">
              <thead>
                <th className="w-composer-history-order">Order</th>
                <th className="w-composer-history-date">Date</th>
                <th className="w-composer-history-method">Method</th>
                <th className="w-composer-history-url">URL</th>
                <th className="w-composer-history-operation">Operation</th>
              </thead>
              <tbody>
                {
                  data.map(function(item, i) {
                    var date = item.dateStr = item.dateStr || new Date(item.date).toLocaleString();
                    return (
                      <tr>
                        <th className="w-composer-history-order">{i + 1}</th>
                        <td className="w-composer-history-date" title={date}>{date}</td>
                        <td className="w-composer-history-method">{item.method}</td>
                        <td className="w-composer-history-url" title={item.url}>{item.url}</td>
                        <td className="w-composer-history-operation">
                          <button onClick={self.replay} className="btn btn-primary">Replay</button>
                          <button onClick={self.compose} className="btn btn-default">Compose</button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
             </table>
          </div>
        </Dialog>
    );
  }
});

module.exports = HistoryData;
