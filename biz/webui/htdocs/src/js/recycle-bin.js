var React = require('react');
var Dialog = require('./dialog');
var message = require('./message');
var dataCenter = require('./data-center');

var RecycleBinDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  show: function(options) {
    var self = this;
    self.setState(options, function() {
      self.refs.recycleBinDialog.show();
    });
  },
  render: function() {
    var state = this.state;
    var self = this;
    var list = state.list || [];

    return (
      <Dialog ref="recycleBinDialog" wstyle="w-files-dialog">
        <div className="modal-body">
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
          <h4>
            {state.name} Recycle Bin
          </h4>
          <table className="table">
              <thead>
                <th className="w-files-order">#</th>
                <th className="w-files-date">Date</th>
                <th className="w-files-path">Filename</th>
                <th className="w-files-operation">Operation</th>
              </thead>
              <tbody>
                {
                  list.length ? list.map(function(item, i) {
                    var filePath = '/$whistle/' + item.name;
                    return (
                      <tr>
                        <th className="w-files-order">{ i + 1 }</th>
                        <td className="w-files-date">{item.date}</td>
                        <td className="w-files-path">{filePath}</td>
                        <td className="w-files-operation">
                          <a>View</a>
                          <a data-name={item.name} onClick={self.downloadFile}>Recover</a>
                          <a data-name={item.name} onClick={self.remove}>Delete</a>
                        </td>
                      </tr>
                    );
                  })
                 : (
                  <tr>
                    <td colSpan="4" style={{textAlign: 'center'}}>
                      Empty
                    </td>
                  </tr>
                )
              }
              </tbody>
             </table>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

var RecycleBinDialogWrap = React.createClass({
  shouldComponentUpdate: function() {
    return false;
  },
  show: function(options) {
    this.refs.recycleBinDialog.show(options);
  },
  render: function() {
    return <RecycleBinDialog ref="recycleBinDialog" />;
  }
});

module.exports = RecycleBinDialogWrap;
