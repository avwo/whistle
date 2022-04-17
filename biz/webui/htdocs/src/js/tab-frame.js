var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var dataCenter = require('./data-center');
var events = require('./events');
var getBridge = require('./bridge');

var modal = dataCenter.networkModal;

function onWhistleInspectorCustomTabReady(init, win) {
  if (typeof init !== 'function') {
    return;
  }
  var bridge = getBridge(win);
  bridge.getActiveSession = function () {
    return modal.getActive();
  };
  bridge.getSelectedSessionList = function () {
    return modal.getSelectedList();
  };
  init(bridge);
}

var TabFrame = React.createClass({
  getInitialState: function () {
    var url = this.props.src;
    url += url.indexOf('?') === -1 ? '?' : '&';
    return {
      url:
        url + '???_WHISTLE_PLUGIN_INSPECTOR_TAB_' + dataCenter.getPort() + '???'
    };
  },
  componentDidMount: function () {
    events.on('selectedSessionChange', this.handlePush);
  },
  componentWillUnmount: function () {
    events.off('selectedSessionChange', this.handlePush);
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  compose: function (item) {
    this.handlePush(null, null, item);
  },
  handlePush: function (_, item, comItem) {
    try {
      var win = ReactDOM.findDOMNode(this.refs.iframe).contentWindow;
      if (
        win &&
        typeof win.__pushWhistle5b6af7b9884e1165SessionActive__ === 'function'
      ) {
        if (comItem) {
          win.__pushWhistle5b6af7b9884e1165SessionActive__(null, null, comItem);
          comItem = null;
        } else if (this.props.hide) {
          win.__pushWhistle5b6af7b9884e1165SessionActive__(null, true);
        } else {
          win.__pushWhistle5b6af7b9884e1165SessionActive__(
            item || modal.getActive()
          );
        }
      }
    } catch (e) {}
    this.composeItem = comItem;
  },
  componentDidUpdate: function () {
    this.handlePush();
  },
  onLoad: function () {
    if (this.composeItem) {
      this.handlePush(null, null, this.composeItem);
      this.composeItem = null;
    }
  },
  render: function () {
    var display = this.props.hide ? 'none' : undefined;
    // 防止被改
    window.onWhistleInspectorCustomTabReady = onWhistleInspectorCustomTabReady;
    return (
      <iframe
        onLoad={this.onLoad}
        ref="iframe"
        src={this.state.url}
        style={{ display: display }}
        className="fill w-tab-frame"
      />
    );
  }
});

module.exports = TabFrame;
