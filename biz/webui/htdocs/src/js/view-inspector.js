var React = require('react');
var util = require('./util');

var trigger = util.trigger;

var ViewInspector = React.createClass({
  getInitialState: function () {
    return { visible: false };
  },
  showInspectors: function () {
    trigger('setActiveSession', this.props.reqId);
    trigger('showInspectors');
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    var reqId = nextProps.reqId;
    var isChanged = this.props.reqId !== reqId;
    if (isChanged) {
      trigger('checkViewInspectors', reqId);
    }
    return isChanged || this.state.visible !== nextState.visible;
  },
  componentDidMount: function() {
    util.on('showViewInspectorsBtn', (_, visible) => {
      this.setState({ visible: visible });
    });
    trigger('checkViewInspectors', this.props.reqId);
  },
  render: function() {
    if (!this.state.visible || !this.props.reqId) {
      return null;
    }
    return <a className="w-view-inspectors-btn" onClick={this.showInspectors}>View server-received request data</a>;
  }
});

module.exports = ViewInspector;
