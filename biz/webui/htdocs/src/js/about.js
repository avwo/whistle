require('../css/about.css');
var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var storage = require('./storage');
var util = require('./util');
var events = require('./events');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var isElectron = util.isElectron;
var clientName = isElectron ? 'electron' : 'nodejs';

var About = React.createClass({
  getInitialState: function () {
    return {};
  },
  hasNewVersion: function (data) {
    var clientVersion = this.props.clientVersion;
    var state = this.state;
    var flag = util.compareVersion(data.latestVersion, data.version);
    state._hasNewWhistle = flag;
    state._hasNewClient = 0;
    flag = flag && util.compareVersion(data.latestVersion, storage.get('latestVersion'));
    if (!flag && clientVersion && data.latestClientVersion) {
      state._hasNewClient = util.compareVersion(data.latestClientVersion, clientVersion);
      return state._hasNewClient &&
      util.compareVersion(data.latestClientVersion, storage.get('latestClientVersion'));
    }
    return flag;
  },
  componentDidMount: function () {
    var self = this;
    var updateVersion = function(data) {
      self.setState({
        version: data.version,
        latestVersion: data.latestVersion,
        latestClientVersion: data.latestClientVersion,
        hasUpdate: self.checkUpdate(self.hasNewVersion(data))
      });
    };
    dataCenter.getInitialData(updateVersion);
    events.on('updateVersion', function(_, data) {
      updateVersion(data);
    });
  },
  checkUpdate: function (hasNew) {
    if (this.props.onCheckUpdate) {
      if ((!this._hasUpdate && !hasNew) || hasNew !== this._hasUpdate) {
        this._hasUpdate = hasNew;
        this.props.onCheckUpdate(hasNew);
      }
    }
    return hasNew;
  },
  checkUpdateClient: function (e) {
    if (this.state._hasNewClient && dataCenter.showLatestClientVersion()) {
      e.preventDefault();
    }
  },
  showAboutInfo: function () {
    var self = this;
    self.showDialog();
    var onClick = self.props.onClick;
    if (typeof onClick === 'function') {
      onClick();
    }

    dataCenter.checkUpdate(function (data) {
      if (data && data.ec === 0) {
        if (data.latestVersion) {
          storage.set('latestVersion', data.latestVersion);
        }
        if (data.latestClientVersion) {
          storage.set('latestClientVersion', data.latestClientVersion);
        }
        self.setState({
          version: data.version,
          latestVersion: data.latestVersion,
          latestClientVersion: data.latestClientVersion,
          hasUpdate: self.checkUpdate(self.hasNewVersion(data))
        });
      }
    });
  },
  showDialog: function () {
    this.refs.aboutDialog.show();
  },
  hideDialog: function () {
    this.refs.aboutDialog.hide();
  },
  render: function () {
    var self = this;
    var state = self.state;
    var version = state.version;
    var latest = state.latestVersion;
    var latestClient = state.latestClientVersion;
    var clientVersion = self.props.clientVersion;
    var hasNewWhistle = state._hasNewWhistle;
    var hasNewClient = state._hasNewClient;

    return (
      <a
        draggable="false"
        onClick={self.showAboutInfo}
        className="w-about-menu"
      >
        {state.hasUpdate ? <i className="w-new-version-icon" /> : null}
        <Icon name="info-sign" />About
        <Dialog ref="aboutDialog" wstyle="w-about-dialog">
          <div className="modal-body w-about-has-plugins">
            <CloseBtn />
            <img alt="logo" src="img/whistle.png?v=2016" />
            <span className="w-about-dialog-ctn">
              <span className="w-about-dialog-title">
                Whistle for Web Developers
              </span>
              {clientVersion ? 'Client Version: ' : null}
              {clientVersion ? <a
                className="w-about-version"
                title="View CHANGELOG"
                href="https://github.com/avwo/whistle-client/blob/main/CHANGELOG.md"
                target="_blank"
              >
                {clientVersion}
              </a> : null}
              {hasNewClient ? <a
                className="w-new-version"
                title="Update Whistle Client"
                onClick={self.checkUpdateClient}
                href={util.UPDATE_URL}
                target="_blank"
              >
                (NEW: {latestClient})
              </a> : null}
              {clientVersion ? <br /> : null}
              {clientVersion ? 'Whistle Version: ' : 'Version: '}
              <a
                className="w-about-version"
                title="View CHANGELOG"
                onClick={util.openChangeLog}
              >
                {version}
              </a>
              {hasNewWhistle ? <a
                className="w-new-version"
                title={clientVersion ? 'Update Whistle Client' : 'Update Whistle'}
                onClick={self.checkUpdateClient}
                href={util.UPDATE_URL}
                target="_blank"
              >
                (NEW: {latest})
              </a> : null}
              <br />
              Visit{' '}
              <a
                className="w-about-url"
                href={util.getDocUrl() + '?type=' + clientName + '&version=' + version}
                target="_blank"
              >
                https://wproxy.org
              </a>
            </span>
          </div>
          <div className="modal-footer">
            {hasNewWhistle || hasNewClient ? (
              <a
                className="btn btn-primary"
                title={clientVersion ? 'Update Whistle Client' : 'Update Whistle'}
                onClick={self.checkUpdateClient}
                href={util.UPDATE_URL}
                target="_blank"
              >
                Update Now
              </a>
            ) : null}
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
      </a>
    );
  }
});

module.exports = About;
