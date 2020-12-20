var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var events = require('./events');

var TIMESTAMP_RE = /^(\d+)\.([\s\S]+)$/;

function decode(name) {
  try {
    return decodeURIComponent(name);
  } catch (e) {}
  return name;
}

var RecycleBinDialog = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    var self = this;
    events.on('rulesRecycleList', function(_, data) {
      if (self.state.name === 'Rules') {
        self.show(data, true);
      }
    });
    events.on('valuesRecycleList', function(_, data) {
      if (self.state.name === 'Values') {
        self.show(data, true);
      }
    });
  },
  show: function(options, quiet) {
    var self = this;
    if (options.list) {
      options.list = options.list.map(function(name) {
        if (!TIMESTAMP_RE.test(name)) {
          return;
        }
        return {
          filename: decode(RegExp.$2),
          date: util.toLocaleString(new Date(parseInt(RegExp.$1, 10))),
          name: name
        };
      }).filter(util.noop);
    }
    self.setState(options, function() {
      !quiet && self.refs.recycleBinDialog.show();
    });
  },
  checkFile: function(data, xhr) {
    if (!data) {
      util.showSystemError(xhr);
      return;
    }
    if (data.ec === 3) {
      var self = this;
      message.error('The file does not exist.');
      dataCenter[this.state.name.toLowerCase()]
      .recycleList(function(result, xhr) {
        if (!result) {
          util.showSystemError(xhr);
          return;
        }
        self.show(result);
      });
      return;
    }
    return true;
  },
  view: function(e) {
    var self = this;
    var name = e.target.getAttribute('data-name');
    dataCenter[this.state.name.toLowerCase()]
        .recycleView({ name: name }, function(data, xhr) {
          if (!self.checkFile(data, xhr)) {
            return;
          }
          if (!data.data) {
            return message.warn('No content.');
          }
          util.openEditor(data.data);
        });
  },
  recover: function(item) {
    var self = this;
    dataCenter[self.state.name.toLowerCase()]
      .recycleView({ name: item.name }, function(data, xhr) {
        if (!self.checkFile(data, xhr)) {
          return;
        }
        item.data = data.data;
        events.trigger('recover' + self.state.name, item);
      });
  },
  remove: function(e) {
    var name = e.target.getAttribute('data-name');
    var origName = decode(name.substring(name.indexOf('.') + 1));
    if (confirm('Are you sure to delete \'' + origName + '\' completely.')) {
      var self = this;
      dataCenter[this.state.name.toLowerCase()]
        .recycleRemove({ name: name }, function(data, xhr) {
          if (!data) {
            util.showSystemError(xhr);
            return;
          }
          self.show(data);
        });
    }
  },
  render: function() {
    var self = this;
    var state = self.state;
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
                    return (
                      <tr key={item.name}>
                        <th className="w-files-order">{ i + 1 }</th>
                        <td className="w-files-date">{item.date}</td>
                        <td className="w-files-path" title={item.filename}>{item.filename}</td>
                        <td className="w-files-operation">
                          <a data-name={item.name} onClick={self.view}>View</a>
                          <a onClick={function() {
                            self.recover(item);
                          }}>Recover</a>
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
