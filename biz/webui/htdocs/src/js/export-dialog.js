var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var Dialog = require('./dialog');
var ShareViaUrlBtn = require('./share-via-url-btn');
var util = require('./util');
var ModalHeader = require('./modal-header');
var DismissBtn = require('./dismiss-btn');

var ExportDialog = React.createClass({
  getInitialState: function () {
    return { filename: '' };
  },
  show: function (name, data) {
    var self = this;
    self.refs.dialog.show();
    setTimeout(function () {
      var input = findDOMNode(self.refs.input);
      input.focus();
      input.select();
    }, 500);
    name = name || 'network';
    self.setState({
      name: name,
      title: util.getDialogTitle(name, 'Export'),
      showOptions: name === 'network',
      data: data
    });
  },
  getInputValue: function() {
    return util.formatFilename(findDOMNode(this.refs.input).value.trim());
  },
  getFilename: function () {
    var name = this.state.name;
    var suffix = name === 'console' || name === 'server' ? '.log' : '.txt';
    var filename = this.getInputValue();
    if (filename) {
      if (!/\.(txt|json)/i.test(filename)) {
        filename += suffix;
      }
      return filename;
    }
    switch (name) {
    case 'networkSettings':
      filename = 'network_settings_';
      break;
    case 'composer':
      filename = 'composer_';
      break;
    case 'console':
      filename = 'console_';
      break;
    case 'server':
      filename = 'server_';
      break;
    case 'rulesSettings':
      filename = 'rules_settings_';
      break;
    case 'valuesSettings':
      filename = 'values_settings_';
      break;
    case 'mock':
      filename = 'rules_items_';
      break;
    default:
      filename = 'network_';
    }
    return filename + util.formatDate() + suffix;
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  export: function(e) {
    if (util.checkSubmit(e)) {
      return;
    }
    var self = this;
    var data = self.state.data;
    if (util.isFunc(data)) {
      data = data();
    }
    self.hide();
    util.download(data, self.getFilename());
    findDOMNode(self.refs.input).value = '';
  },
  filterFilename: function (e) {
    this.setState({ filename: util.formatFilename(e.target.value) });
  },
  onShare: function(err) {
    if (!err) {
      this.hide();
      findDOMNode(this.refs.input).value = '';
    }
  },
  shouldComponentUpdate: util.scuDlg,
  render: function () {
    var self = this;
    var state = self.state;
    var showOptions = state.showOptions;

    return (
      <Dialog ref="dialog" wstyle={'w-ie-dialog' + (showOptions ? ' w-export-network' : '')}>
        <ModalHeader>
          {state.title}
        </ModalHeader>
        <div className="modal-body">
          <input
            ref="input"
            value={state.filename}
            onChange={self.filterFilename}
            onKeyDown={self.export}
            placeholder="Enter filename (optional)"
            className="form-control"
            maxLength="64"
          />
        </div>
        <div className="modal-footer">
          <DismissBtn />
          <ShareViaUrlBtn type={state.name} data={state.data} getFilename={self.getInputValue} onComplete={self.onShare} />
          <button
            type="button"
            className="btn btn-primary"
            data-dismiss="modal"
            onClick={self.export}
          >
            Export
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = ExportDialog;
