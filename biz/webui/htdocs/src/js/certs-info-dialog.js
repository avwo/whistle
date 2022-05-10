require('./base-css.js');
require('../css/certs.css');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var Dialog = require('./dialog');
var TipsDialog = require('./tips-dialog');
var win = require('./win');
var dataCenter = require('./data-center');
var message = require('./message');

var OK_STYLE = { color: '#5bbd72' };
var MAX_CERT_SIZE = 128 * 1024;

function getCertName(cert, filename) {
  filename = filename || cert.filename;
  return filename + '.' + (cert.type || 'crt');
}

function readFile(file, callback) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function () {
    callback(reader.result);
  };
}

var HistoryData = React.createClass({
  getInitialState: function () {
    return { list: [] };
  },
  show: function (data, dir) {
    var list = [];
    var rootCA;
    this._certsDir = this._certsDir || dir;
    Object.keys(data).forEach(function (filename) {
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
        type: cert.type,
        validity: startDate.toLocaleString() + ' ~ ' + endDate.toLocaleString(),
        status: status || (
          <span className="glyphicon glyphicon-ok" style={OK_STYLE} />
        ),
        isInvalid: isInvalid
      };
      if (filename === 'root') {
        item.displayName = 'root (Root CA)';
        rootCA = item;
        item.readOnly = true;
      } else {
        if (filename[0] === 'z' && filename[1] === '/') {
          filename = filename.substring(2);
          item.readOnly = true;
        }
        item.displayName = getCertName(item, filename);
        list.push(item);
      }
    });
    list.sort(function (a, b) {
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
  hide: function () {
    this.refs.certsInfoDialog.hide();
    this._hideDialog = true;
  },
  showRemoveTips: function (item) {
    var dir = (item.dir || '').replace(/\\/g, '/');
    dir = dir + (/\/$/.test(dir) ? '' : '/');
    var crt = dir + getCertName(item);
    var key = dir + item.filename + '.key';
    this.refs.tipsDialog.show({
      title: 'Delete the following files and restart whistle:',
      tips: key + '\n' + crt,
      dir: item.dir
    });
  },
  handleCgi: function (data, xhr) {
    if (!data) {
      return util.showSystemError(xhr);
    }
    this.show(data);
  },
  removeCert: function (item) {
    var self = this;
    win.confirm(
      'Are you sure to delete \'' + getCertName(item) + '\'.',
      function (sure) {
        if (!sure) {
          return;
        }
        dataCenter.certs.remove({ filename: item.filename, type: item.type }, self.handleCgi);
      }
    );
  },
  shouldComponentUpdate: function () {
    return this._hideDialog === false;
  },
  formatFiles: function (fileList) {
    var certs;
    for (var i = 0, len = fileList.length; i < len; i++) {
      var cert = fileList[i];
      if (cert.size > MAX_CERT_SIZE || !(cert.size > 0)) {
        message.error('The uploaded certificate size cannot exceed 128K.');
        return;
      }
      var { name } = cert;
      if (!/\.(crt|cer|pem|key)/.test(name)) {
        message.error('Only files with .key, .crt, .cer, .pem suffixes are supported.');
        return;
      }
      var suffix = RegExp.$1;
      name = name.slice(0, -4);
      if (!name || name.length > 128) {
        message.error(
          'The file name cannot be empty and the length cannot exceed 128.'
        );
        return;
      }
      certs = certs || {};
      var pair = certs[name] || {};
      pair[suffix == 'key' ? 'key' : 'cert'] = cert;
      if (suffix !== 'key') {
        pair.type = suffix;
      }
      certs[name] = pair;
    }
    if (!certs) {
      return;
    }
    var result;
    Object.keys(certs).forEach(function (key) {
      var cert = certs[key];
      if (cert.key && cert.cert) {
        result = result || {};
        result[key] = cert;
      }
    });
    return result;
  },
  handleChange: function (e) {
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.uploadCerts);
    var files = input.files && self.formatFiles(input.files);
    input.value = '';
    if (!files) {
      return;
    }
    if (files.root) {
      var dir = self._certsDir || '~/.WhistleAppData/custom_certs';
      win.alert(
        'Root CA cannot be uploaded by UI.\nYou must manually upload to follow directory and restart Whistle:\n' +
          dir
      );
      delete files.root;
    }
    var handleCallback = function () {
      dataCenter.certs.upload(JSON.stringify(files), self.handleCgi);
    };
    var keys = Object.keys(files);
    var len = keys.length * 2;
    keys.map((name) => {
      var file = files[name];
      readFile(file.key, function (text) {
        file.key = text;
        if (--len === 0) {
          handleCallback();
        }
      });
      readFile(file.cert, function (text) {
        file.cert = text;
        if (--len === 0) {
          handleCallback();
        }
      });
    });
  },
  showUpload: function () {
    ReactDOM.findDOMNode(this.refs.uploadCerts).click();
  },
  render: function () {
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
              <span className="glyphicon glyphicon-question-sign"></span>
            </a>
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
              {list.length ? (
                list.map(function (item, i) {
                  return (
                    <tr
                      className={item.isInvalid ? 'w-cert-invalid' : undefined}
                    >
                      <th className="w-certs-info-order">{i + 1}</th>
                      <td
                        className="w-certs-info-filename"
                        title={item.filename}
                      >
                        {item.readOnly ? (
                          <span className="glyphicon glyphicon-lock" />
                        ) : undefined}
                        {item.displayName || item.filename}
                        <br />
                        <a
                          className="w-delete"
                          onClick={function () {
                            item.readOnly
                              ? self.showRemoveTips(item)
                              : self.removeCert(item);
                          }}
                          title=""
                          style={{
                            color: item.readOnly ? '#337ab7' : undefined
                          }}
                        >
                          {item.readOnly ? 'View path' : 'Delete'}
                        </a>
                      </td>
                      <td className="w-certs-info-domain" title={item.domain}>
                        {item.domain}
                      </td>
                      <td
                        className="w-certs-info-validity"
                        title={item.validity}
                      >
                        {item.validity}
                      </td>
                      <td className="w-certs-info-status">{item.status}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="w-empty">
                    Empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <input
            ref="uploadCerts"
            style={{ display: 'none' }}
            type="file"
            accept=".crt,.cer,.pem,.key"
            multiple="multiple"
            onChange={self.handleChange}
          />
          <button
            type="button"
            style={{
              display: dataCenter.isDiableCustomCerts() ? 'none' : undefined
            }}
            className="btn btn-primary"
            onClick={self.showUpload}
          >
            Upload
          </button>
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
        <TipsDialog ref="tipsDialog" />
      </Dialog>
    );
  }
});

module.exports = HistoryData;
