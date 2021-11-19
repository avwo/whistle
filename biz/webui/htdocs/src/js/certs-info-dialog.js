require('./base-css.js');
require('../css/certs.css');
var React = require('react');
var util = require('./util');
var Dialog = require('./dialog');
var TipsDialog = require('./tips-dialog');
var win = require('./win');
var dataCenter = require('./data-center');

var OK_STYLE = { color: '#5bbd72' };

var HistoryData = React.createClass({
  getInitialState: function() {
    return { list: [] };
  },
  show: function(data) {
    var list = [];
    var rootCA;
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
      var item = {
        dir: cert.dir,
        filename: filename,
        domain: cert.dnsName,
        mtime: cert.mtime,
        validity: startDate.toLocaleString() + ' ~ ' + endDate.toLocaleString(),
        status: status || <span className="glyphicon glyphicon-ok" style={OK_STYLE} />,
        isInvalid: isInvalid
      };
      if (filename === 'root') {
        item.displayName = 'root (Root CA)';
        rootCA = item;
        item.readOnly = true;
      } else {
        if (filename[0] === 'z' && filename[1] === '/') {
          item.displayName = filename.substring(2);
          item.readOnly = true;
        }
        list.push(item);
      }
    });
    list.sort(function(a, b) {
      if (a.readOnly) {
        return b.readOnly ? 0 : -1;
      }
      if (b.readOnly) {
        return 1;
      }
      return util.compare(b.mtime, a.mtime);
    });
    if (rootCA) {
      list.unshift(rootCA);
    }
    this.refs.certsInfoDialog.show();
    this._hideDialog = false;
    this.setState({ list: list });
  },
  hide: function() {
    this.refs.certsInfoDialog.hide();
    this._hideDialog = true;
  },
  showRemoveTips: function(item) {
    var dir = (item.dir || '').replace(/\\/g, '/');
    dir = dir + (/\/$/.test(dir) ? '' : '/') + item.filename;
    var crt = dir + '.crt';
    var key = dir + '.key';
    this.refs.tipsDialog.show({
      title: 'Delete the following files and restart whistle:',
      tips: key + '\n' + crt,
      dir: item.dir
    });
  },
  removeCert: function(item) {
    var self = this;
    win.confirm('Are you sure to delete \'' + item.filename + '\'.', function(sure) {
      if (!sure) {
        return;
      }
      dataCenter.certs.remove({ filename: item.filename }, function(data, xhr) {
        if (!data) {
          return util.showSystemError(xhr);
        }
        self.show(data);
      });
    });
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
            <h4 className="w-certs-info-title">
              <a
                className="w-help-menu"
                title="Click here to see help"
                href="https://avwo.github.io/whistle/custom-certs.html"
                target="_blank"
              >
              <span className="glyphicon glyphicon-question-sign"></span></a>
              Custom Certs
            </h4>
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
                          {item.readOnly ? <span className="glyphicon glyphicon-lock" /> : undefined}
                          {item.displayName || item.filename}<br />
                          <a className="w-delete" onClick={function() {
                            item.readOnly ? self.showRemoveTips(item) : self.removeCert(item);
                          }} title="" style={{color: item.readOnly ? '#337ab7' : undefined }}>
                            {item.readOnly ? 'View path' : 'Delete'}
                          </a>
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
            <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
          </div>
          <TipsDialog ref="tipsDialog" />
        </Dialog>
    );
  }
});

module.exports = HistoryData;
