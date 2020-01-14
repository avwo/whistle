require('./base-css.js');
require('../css/certs.css');
var React = require('react');
var util = require('./util');
var Dialog = require('./dialog');

var OK_STYLE = { color: '#5bbd72' };

var HistoryData = React.createClass({
  getInitialState: function() {
    return { list: [] };
  },
  show: function(data) {
    var list = [];
    Object.keys(data).forEach(function(filename) {
      var cert = data[filename];
      var startDate = new Date(cert.notBefore);
      var endDate = new Date(cert.notAfter);
      var status = '';
      var now = Date.now();
      var isInvalid;
      if (startDate.getTime() > now) {
        isInvalid = true;
        status = 'Invalid';
      } else if (endDate.getTime() < now) {
        isInvalid = true;
        status = 'Expired';
      }
      list.push({
        dir: cert.dir,
        filename: filename,
        domain: cert.dnsName,
        mtime: cert.mtime,
        validity: startDate.toLocaleString() + ' ~ ' + endDate.toLocaleString(),
        status: status || <span className="glyphicon glyphicon-ok" style={OK_STYLE} />,
        isInvalid: isInvalid
      });
    });
    list.sort(function(a, b) {
      return util.compare(b.mtime, a.mtime);
    });
    this.refs.certsInfoDialog.show();
    this._hideDialog = false;
    this.setState({ list: list });
  },
  hide: function() {
    this.refs.certsInfoDialog.hide();
    this._hideDialog = true;
  },
  shouldComponentUpdate: function() {
    return this._hideDialog === false;
  },
  render: function() {
    var self = this;
    var list = self.state.list || [];
    return (
      <Dialog ref="certsInfoDialog" wstyle="w-certs-info-dialog">
          <div className="modal-body">
            <button type="button" className="close" onClick={self.hide}>
              <span aria-hidden="true">&times;</span>
            </button>
             <table className="table">
              <thead>
                <th className="w-certs-info-order">#</th>
                <th className="w-certs-info-filename">Filename</th>
                <th className="w-certs-info-domain">DNS Name</th>
                <th className="w-certs-info-validity">Validity</th>
                <th className="w-certs-info-status">Status</th>
              </thead>
              <tbody>
                {
                  list.length ? list.map(function(item, i) {
                    return (
                      <tr className={item.isInvalid ? 'w-cert-invalid' : undefined}>
                        <th className="w-certs-info-order">{i + 1}</th>
                        <td className="w-certs-info-filename" title={item.filename}>
                          {item.filename}<br />
                          <a className="w-copy-text-with-tips" data-clipboard-text={item.dir}>Copy path</a>
                        </td>
                        <td className="w-certs-info-domain" title={item.domain}>{item.domain}</td>
                        <td className="w-certs-info-validity" title={item.validity}>{item.validity}</td>
                        <td className="w-certs-info-status">{item.status}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="w-empty">Empty</td>
                    </tr>
                  )
                }
              </tbody>
             </table>
          </div>
          <div className="modal-footer">
            <a href="https://avwo.github.io/whistle/custom-certs.html" target="_blank" className="btn btn-primary">Help</a>
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </Dialog>
    );
  }
});

module.exports = HistoryData;
