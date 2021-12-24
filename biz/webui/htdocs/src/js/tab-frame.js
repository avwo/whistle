var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var dataCenter = require('./data-center');
var events = require('./events');
var getBridge = require('./bridge');

var modal = dataCenter.networkModal;

function onWhistleInspectorCustomTabReady(init) {
  if (typeof init !== 'function') {
    return;
  }
  var bridge = getBridge();
  bridge.getActiveSession = function() {
    return modal.getActive();
  };
  bridge.getSelectedSessionList = function() {
    return modal.getSelectedList();
  };
  init(bridge);
}

function checkReady(item, isReq) {
  return !item || item.lost || (isReq ? item.requestTime : item.endTime);
}

var TabFrame = React.createClass({
  getInitialState: function() {
    var url = this.props.src;
    url += (url.indexOf('?') === -1 ? '?' : '&');
    return {
      url: url + '???_WHISTLE_PLUGIN_INSPECTOR_TAB_' + dataCenter.getPort() + '???'
    };
  },
  componentDidMount: function() {
    events.on('selectedSessionChange', this.handlePush);
  },
  componentWillUnmount: function() {
    events.off('selectedSessionChange', this.handlePush);
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  handlePush: function(_, item) {
    var isReq = this.props.isReq;
    try {
      var win = ReactDOM.findDOMNode(this.refs.iframe).contentWindow;
      if (win && typeof win.__pushWhistle5b6af7b9884e1165SessionActive__ === 'function') {
        var selectedList = modal.getSelectedList();
        win.__pushWhistle5b6af7b9884e1165SessionActive__(item, selectedList);
        if (checkReady(item, isReq)) {
          win.__pushWhistle5b6af7b9884e1165SessionReady__(item, selectedList);
          this._sessionReady = true;
        } else {
          this._sessionReady = false;
        }
      }
    } catch (e) {}
  },
  componentDidUpdate: function() {
    if (this._sessionReady === false) {
      var item = modal.getActive();
      if (checkReady(item, this.props.isReq)) {
        try {
          var win = ReactDOM.findDOMNode(this.refs.iframe).contentWindow;
          if (win && typeof win.__pushWhistle5b6af7b9884e1165SessionReady__ === 'function') {
            win.__pushWhistle5b6af7b9884e1165SessionReady__(item, modal.getSelectedList());
            this._sessionReady = true;
          }
        } catch (e) {}
      }
    }
  },
  render: function() {
    var display = this.props.hide ? 'none' : undefined;
    // 防止被改
    window.onWhistleInspectorCustomTabReady = onWhistleInspectorCustomTabReady;
    return <iframe ref="iframe" src={this.state.url} style={{display: display}} className="fill w-tab-frame"  />;
  }
});

module.exports = TabFrame;
