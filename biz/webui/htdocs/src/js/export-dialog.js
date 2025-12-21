require('../css/import-dialog.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Dialog = require('./dialog');
var ShareViaUrlBtn = require('./share-via-url-btn');
var util = require('./util');

var ExportDialog = React.createClass({
  getInitialState: function () {
    return { filename: '' };
  },
  show: function (name, data) {
    var self = this;
    self.refs.exportDialog.show();
    setTimeout(function () {
      var input = ReactDOM.findDOMNode(self.refs.input);
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
    return util.formatFilename(ReactDOM.findDOMNode(this.refs.input).value.trim());
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
      filename = 'mock_';
      break;
    default:
      filename = 'network_';
    }
    return filename + util.formatDate() + suffix;
  },
  hide: function () {
    this.refs.exportDialog.hide();
  },
  export: function(e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var data = this.state.data;
    if (typeof data === 'function') {
      data = data();
    }
    this.hide();
    util.download(data, this.getFilename());
    ReactDOM.findDOMNode(this.refs.input).value = '';
  },
  filterFilename: function (e) {
    this.setState({ filename: util.formatFilename(e.target.value) });
  },
  onShare: function(err) {
    if (!err) {
      this.hide();
      ReactDOM.findDOMNode(this.refs.input).value = '';
    }
  },
  shouldComponentUpdate: function () {
    return this.refs.exportDialog.isVisible();
  },
  render: function () {
    var state = this.state;
    var showOptions = state.showOptions;

    return (
      <Dialog ref="exportDialog" wstyle={'w-ie-dialog' + (showOptions ? ' w-export-network' : '')}>
        <div className="modal-header">
          <h4>{state.title}</h4>
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          <input
            ref="input"
            value={state.filename}
            onChange={this.filterFilename}
            onKeyDown={this.export}
            placeholder="Enter filename (optional)"
            className="form-control"
            maxLength="64"
          />
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Cancel
          </button>
          <ShareViaUrlBtn type={state.name} data={state.data} getFilename={this.getInputValue} onComplete={this.onShare} />
          <button
            type="button"
            className="btn btn-primary w-fmt-btn"
             data-dismiss="modal"
             onClick={this.export}
          >
            Export
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = ExportDialog;
