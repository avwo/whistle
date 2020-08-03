require('./base-css.js');
require('../css/about.css');
/* eslint-disable no-unused-vars */
var $ = window.jQuery = require('jquery'); //for bootstrap
require('bootstrap/dist/js/bootstrap.js');
var React = require('react');
var Dialog = require('./dialog');
var dataCenter = require('./data-center');
var storage = require('./storage');
var util = require('./util');

function hasNewVersion(data) {
  return util.compareVersion(data.latestVersion, data.version) && util.compareVersion(data.latestVersion, storage.get('latestVersion'));
}

var About = React.createClass({
  componentDidMount: function() {
    var self = this;
    dataCenter.getInitialData(function(data) {
      self.setState({
        version: data.version,
        latestVersion: data.latestVersion,
        hasUpdate: self.checkUpdate(hasNewVersion(data))
      });
    });
  },
  checkUpdate: function(hasUpdate) {
    if (this.props.onCheckUpdate) {
      if ((!this._hasUpdate && !hasUpdate) || hasUpdate !== this._hasUpdate) {
        this._hasUpdate = hasUpdate;
        this.props.onCheckUpdate(hasUpdate);
      }
    }
    return hasUpdate;
  },
  showAboutInfo: function(showTips) {
    var self = this;
    self.showDialog();
    var onClick = self.props.onClick;
    if (typeof onClick === 'function') {
      onClick();
    }

    dataCenter.checkUpdate(function(data) {
      if (data && data.ec === 0) {
        if (data.latestVersion) {
          storage.set('latestVersion', data.latestVersion);
        }
        self.setState({
          version: data.version,
          latestVersion: data.latestVersion,
          hasUpdate: self.checkUpdate(hasNewVersion(data))
        });
      }
    });
  },
  showDialog: function() {
    this.refs.aboutDialog.show();
  },
  hideDialog: function() {
    this.refs.aboutDialog.hide();
  },
  render: function() {
    var self = this;
    var state = self.state || {};
    var version = state.version;
    var latest = state.latestVersion;

    return (
        <a  draggable="false" onClick={self.showAboutInfo} className="w-about-menu">
          <i style={{display: state.hasUpdate ? 'block' : ''}}></i><span className="glyphicon glyphicon-info-sign"></span>About
          <Dialog ref="aboutDialog" wstyle="w-about-dialog">
            <div className="modal-body w-about-has-plugins">
              <button type="button" className="close" data-dismiss="modal">
                <span aria-hidden="true">&times;</span>
              </button>
              <img alt="logo" src="img/whistle.png?v=2016" />
              <span className="w-about-dialog-ctn">
                <span className="w-about-dialog-title">Whistle for Web Developers.</span>
                Version: <a className="w-about-version" href="https://github.com/avwo/whistle/blob/master/CHANGELOG.md" target="_blank">{version}</a><br/>
                {util.compareVersion(latest, version) ? (<span className="w-about-latest-version">
                  Latest version: <a className="w-about-github" title="How to update whistle" href="https://avwo.github.io/whistle/update.html" target="_blank">{latest}</a><br/>
                </span>) : ''}
                Visit <a className="w-about-url" href={'http://wproxy.org/?type=nodejs&version=' + version} target="_blank">http://wproxy.org</a>
              </span>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </Dialog>
        </a>
    );
  }
});

module.exports = About;

