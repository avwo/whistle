require('../css/service.css');
var React = require('react');
var dataCenter = require('./data-center');

var ServiceBtn = React.createClass({
  save: function() {
    var data = this.props.data;
    if (typeof data === 'function') {
      data = data();
    }
    var onComplete = this.props.onComplete;
    if (typeof onComplete === 'function') {
      onComplete(null);
    }
  },
  render: function () {
    if (!dataCenter.hasToken) {
      return null;
    }
    return (
      <button
        onClick={this.save}
        className="btn btn-warning w-save-to-service-btn"
        draggable="false"
      >
        <span className="glyphicon glyphicon-cloud" />
        Share Via URL
      </button>
    );
  }
});

module.exports = ServiceBtn;
