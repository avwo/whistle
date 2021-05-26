require('./base-css.js');
var React = require('react');
var Dialog = require('./dialog');


var HistoryData = React.createClass({
  getInitialState: function() {
    return { servers: '' };
  },
  show: function(data) {
    if (!data || !data.dns) {
      return;
    }
    this._hideDialog = false;
    var servers = data.dns.split(',').map(function(dns, i) {
      return 'DNS Server' + (i + 1) + ': ' + dns;
    });
    this.setState({
      ipv6: data.r6,
      useDefault: data.df,
      servers: servers.join('\n')
    });
    this.refs.dnsServersDialog.show();
  },
  hide: function() {
    this.refs.dnsServersDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function() {
    return this._hideDialog === false;
  },
  render: function() {
    var state = this.state;
    return (
      <Dialog ref="dnsServersDialog" wstyle="w-dns-servers-dialog">
        <div className="modal-header">
          Resolve {state.ipv6 ? 'IPv6' : 'IPv4'} address from follow DNS servers{state.useDefault ? ' first' : ''}:
          <button type="button" className="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
          <pre className="modal-body">
            {state.servers}
          </pre>
          <div className="modal-footer">
            <button type="button" data-dismiss="modal" className="btn btn-primary w-copy-text-with-tips"
              data-clipboard-text={state.servers}>Copy</button>
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </Dialog>
    );
  }
});

module.exports = HistoryData;
