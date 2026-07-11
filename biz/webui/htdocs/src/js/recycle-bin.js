var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var $ = require('jquery');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var win = require('./win');
var Icon = require('./icon');
var ModalHeader = require('./modal-header');
var DismissBtn = require('./dismiss-btn');

var showSysErr = util.showSysErr;
var addEvent = util.on;
var attr = util.attr;
var TIMESTAMP_RE = /^(\d+)\.([\s\S]+)$/;

function getCgiModule(name) {
  return dataCenter[name.toLowerCase()];
}

function decode(name) {
  try {
    return decodeURIComponent(name);
  } catch (e) {}
  return name;
}

var RecycleBinDialog = React.createClass({
  getInitialState: function () {
    return {};
  },
  componentDidMount: function () {
    var self = this;
    addEvent('rulesRecycleList', function (_, data) {
      if (self.state.name === 'Rules') {
        self.show(data, true);
      }
    });
    addEvent('valuesRecycleList', function (_, data) {
      if (self.state.name === 'Values') {
        self.show(data, true);
      }
    });
  },
  show: function (options) {
    var self = this;
    if (options.list) {
      options.list = options.list
        .map(function (name) {
          if (!TIMESTAMP_RE.test(name)) {
            return;
          }
          return {
            filename: decode(RegExp.$2),
            date: util.toDateStr(parseInt(RegExp.$1, 10)),
            name: name
          };
        })
        .filter(util.noop);
    }
    self.refs.dialog.show();
    self.setState(options);
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  checkFile: function (data, xhr) {
    if (!data) {
      showSysErr(xhr);
      return;
    }
    if (data.ec === 3) {
      var self = this;
      message.error('File not found');
      getCgiModule(self.state.name).recycleList(function (
        result,
        xhr
      ) {
        if (!result) {
          showSysErr(xhr);
          return;
        }
        self.show(result);
      });
      return;
    }
    return true;
  },
  view: function (e) {
    var self = this;
    var name = attr(e.target, 'data-name');
    getCgiModule(self.state.name).recycleView(
      { name: name },
      function (data, xhr) {
        if (!self.checkFile(data, xhr)) {
          return;
        }
        if (!data.data) {
          return message.info('No content');
        }
        util.openEditor(data.data);
      }
    );
  },
  recover: function (item) {
    var self = this;
    var name = self.state.name;
    getCgiModule(name).recycleView(
      { name: item.name },
      function (data, xhr) {
        if (!self.checkFile(data, xhr)) {
          return;
        }
        item.data = data.data;
        util.trigger('recover' + name, item);
      }
    );
  },
  remove: function (e) {
    var name = attr(e.target, 'data-name');
    var origName = decode(name.substring(name.indexOf('.') + 1));
    var self = this;
    win.confirm(
      util.CMF_DEL_MSG + '\'' + origName + '\' completely?',
      function (sure) {
        if (sure) {
          getCgiModule(self.state.name).recycleRemove(
            { name: name },
            function (data, xhr) {
              if (!data) {
                showSysErr(xhr);
                return;
              }
              self.show(data);
            }
          );
        }
      }
    );
  },
  isVisible: function () {
    return $(findDOMNode(this.refs.recycleBinBody)).is(':visible');
  },
  render: function () {
    var self = this;
    var state = self.state;
    var list = state.list || [];
    return (
      <Dialog ref="dialog" wstyle="w-files-dialog">
        <ModalHeader>
          {state.name} Trash
        </ModalHeader>
        <div className="modal-body" ref="recycleBinBody">
          <table className="table">
            <thead>
              <th className="w-files-order">#</th>
              <th className="w-files-date">Date</th>
              <th className="w-files-path">Filename</th>
              <th className="w-files-operation">Operation</th>
            </thead>
            <tbody className="w-hover-body">
              {list.length ? (
                list.map(function (item, i) {
                  var name = item.name;
                  var filename = item.filename;
                  return (
                    <tr key={name}>
                      <th className="w-files-order">{i + 1}</th>
                      <td className="w-files-date">{item.date}</td>
                      <td className="w-files-path" title={filename}>
                        {util.isGroup(filename) ? <Icon name="triangle-right" className="w-list-group-icon" /> : null}
                        {filename}
                      </td>
                      <td className="w-files-operation">
                        <a data-name={name} onClick={self.view}>
                          View
                        </a>
                        <a
                          onClick={function () {
                            self.recover(item);
                          }}
                        >
                          Restore
                        </a>
                        <a data-name={name} onClick={self.remove}>
                          Delete
                        </a>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <DismissBtn />
        </div>
      </Dialog>
    );
  }
});

var RecycleBinDialogWrap = React.createClass({
  shouldComponentUpdate: function () {
    return false;
  },
  show: function (options) {
    this.refs.dialog.show(options);
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  isVisible: function () {
    return this.refs.dialog.isVisible();
  },
  render: function () {
    return <RecycleBinDialog ref="dialog" />;
  }
});

module.exports = RecycleBinDialogWrap;
