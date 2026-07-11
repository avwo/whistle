require('../css/about.css');
var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var storage = require('./storage');
var util = require('./util');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');
var DismissBtn = require('./dismiss-btn');

var isElectron = util.isElectron;
var compareVersion = util.compareVersion;
var UPDATE_URL = util.UPDATE_URL;
var clientName = isElectron ? 'electron' : 'nodejs';
var CLIENT_CHANGELOG_URL = util.GITHUB_URL + '-client/blob/main/CHANGELOG.md';

var About = React.createClass({
  getInitialState: function () {
    return {};
  },
  hasNewVersion: function (data) {
    var clientVersion = this.props.clientVersion;
    var state = this.state;
    var latestVersion = data.latestVersion;
    var latestClientVersion = data.latestClientVersion;
    var flag = compareVersion(latestVersion, data.version);
    state._hasNewWhistle = flag;
    state._hasNewClient = 0;
    flag = flag && compareVersion(latestVersion, storage.get('latestVersion'));
    if (!flag && clientVersion && latestClientVersion) {
      state._hasNewClient = compareVersion(latestClientVersion, clientVersion);
      return state._hasNewClient &&
      compareVersion(latestClientVersion, storage.get('latestClientVersion'));
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
    util.on('updateVersion', function(_, data) {
      updateVersion(data);
    });
  },
  checkUpdate: function (hasNew) {
    var self = this;
    var onCheckUpdate = self.props.onCheckUpdate;
    if (onCheckUpdate) {
      if ((!self._hasUpdate && !hasNew) || hasNew !== self._hasUpdate) {
        self._hasUpdate = hasNew;
        onCheckUpdate(hasNew);
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
    if (util.isFunc(onClick)) {
      onClick();
    }

    dataCenter.checkUpdate(function (data) {
      if (data && data.ec === 0) {
        var latestVersion = data.latestVersion;
        var latestClientVersion = data.latestClientVersion;
        if (latestVersion) {
          storage.set('latestVersion', latestVersion);
        }
        if (latestClientVersion) {
          storage.set('latestClientVersion', latestClientVersion);
        }
        self.setState({
          version: data.version,
          latestVersion: latestVersion,
          latestClientVersion: latestClientVersion,
          hasUpdate: self.checkUpdate(self.hasNewVersion(data))
        });
      }
    });
  },
  showDialog: function () {
    this.refs.dialog.show();
  },
  hideDialog: function () {
    this.refs.dialog.hide();
  },
  shouldComponentUpdate: util.scuDlg,
  render: function () {
    var self = this;
    var state = self.state;
    var version = state.version;
    var latest = state.latestVersion;
    var latestClient = state.latestClientVersion;
    var clientVersion = self.props.clientVersion;
    var hasNewWhistle = state._hasNewWhistle;
    var hasNewClient = state._hasNewClient;
    var checkUpdateClient = self.checkUpdateClient;
    var title = 'Update Whistle' + (clientVersion ? ' Client' : '');

    return (
      <a
        draggable="false"
        onClick={self.showAboutInfo}
        className="w-about-menu"
      >
        {state.hasUpdate ? <i className="w-new-version-icon" /> : null}
        <Icon name="info-sign" />About
        <Dialog ref="dialog" wstyle="w-about-dialog">
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
                href={CLIENT_CHANGELOG_URL}
                target="_blank"
              >
                {clientVersion}
              </a> : null}
              {hasNewClient ? <a
                className="w-new-version"
                title={title}
                onClick={checkUpdateClient}
                href={UPDATE_URL}
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
                title={title}
                onClick={checkUpdateClient}
                href={UPDATE_URL}
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
                title={title}
                onClick={checkUpdateClient}
                href={UPDATE_URL}
                target="_blank"
              >
                Update Now
              </a>
            ) : null}
            <DismissBtn />
          </div>
        </Dialog>
      </a>
    );
  }
});

module.exports = About;
