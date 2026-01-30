var React = require('react');
var events = require('./events');

var ViewInspector = React.createClass({
  getInitialState: function () {
    return { visible: false };
  },
  showInspectors: function () {
    events.trigger('setActiveSession', this.props.reqId);
    events.trigger('showInspectors');
  },
  shouldComponentUpdate: function (nextProps, nextState) {
    var reqId = nextProps.reqId;
    var isChanged = this.props.reqId !== reqId;
    if (isChanged) {
      events.trigger('checkViewInspectors', reqId);
    }
    return isChanged || this.state.visible !== nextState.visible;
  },
  componentDidMount: function() {
    events.on('showViewInspectorsBtn', (_, visible) => {
      this.setState({ visible: visible });
    });
    events.trigger('checkViewInspectors', this.props.reqId);
  },
  render: function() {
    if (!this.state.visible || !this.props.reqId) {
      return null;
    }
    return <a className="w-view-inspectors-btn" onClick={this.showInspectors}>View server-received request data</a>;
  }
});

module.exports = ViewInspector;
