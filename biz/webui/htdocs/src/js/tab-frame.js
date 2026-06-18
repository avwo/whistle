var React = require('react');
var util = require('./util');
var dataCenter = require('./data-center');
var events = require('./events');
var getBridge = require('./bridge');
var IFrame = require('./iframe');

var modal = dataCenter.networkModal;
var isFunc = util.isFunc;

function onWhistleInspectorCustomTabReady(init, win) {
  if (isFunc(init)) {
    init(getBridge(win));
  }
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
  shouldComponentUpdate: util.shouldComponentUpdate,
  compose: function (item) {
    this.handlePush(null, null, item);
  },
  handlePush: function (_, item, comItem) {
    try {
      var win = this.refs.iframe.getWindow();
      if (
        win &&
        isFunc(win.__pushWhistle5b6af7b9884e1165SessionActive__)
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
    var self = this;
    if (self.composeItem) {
      self.handlePush(null, null, self.composeItem);
      self.composeItem = null;
    }
  },
  render: function () {
    var self = this;
    var display = self.props.hide ? 'none' : undefined;
    // 防止被改
    window.onWhistleInspectorCustomTabReady = onWhistleInspectorCustomTabReady;
    return (
      <IFrame
        onLoad={self.onLoad}
        ref="iframe"
        src={self.state.url}
        style={{ display: display }}
      />
    );
  }
});

module.exports = TabFrame;
