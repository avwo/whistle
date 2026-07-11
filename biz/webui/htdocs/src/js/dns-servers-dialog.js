var React = require('react');
var Dialog = require('./dialog');
var DismissBtn = require('./dismiss-btn');
var util = require('./util');
var ModalHeader = require('./modal-header');

var DNSDialog = React.createClass({
  getInitialState: function () {
    return { servers: '' };
  },
  show: function (data) {
    if (!data || !data.dns) {
      return;
    }
    var self = this;
    var servers = data.dns;
    if (!data.doh) {
      servers = data.dns
        .split(',')
        .map(function (dns, i) {
          return 'DNS Server' + (i + 1) + ':  ' + dns;
        })
        .join('\n');
    }
    self.refs.dialog.show();
    self.setState({
      ipv6: data.r6,
      useDefault: data.df,
      servers: servers,
      doh: data.doh
    });
  },
  hide: function () {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: util.scuDlg,
  render: function () {
    var state = this.state;
    var servers = state.servers;
    var title;
    if (state.doh) {
      title = 'Resolve IP address from follow URL';
    } else {
      title =
        'Resolve ' +
        (state.ipv6 ? 'IPv6' : 'IPv4') +
        ' address from follow DNS servers' +
        (state.useDefault ? ' first' : '');
    }
    return (
      <Dialog ref="dialog" wstyle="w-dns-servers">
        <ModalHeader>{title}</ModalHeader>
        <pre className="modal-body">{servers}</pre>
        <div className="modal-footer">
          <DismissBtn />
          <button
            type="button"
            data-dismiss="modal"
            className="btn btn-primary w-copy-text-with-tips"
            data-clipboard-text={servers}
          >
            Copy
          </button>
        </div>
      </Dialog>
    );
  }
});

module.exports = DNSDialog;
