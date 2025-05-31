require('../css/service.css');
var React = require('react');
var dataCenter = require('./data-center');
var message = require('./message');

var ServiceBtn = React.createClass({
  save: function() {
    var props = this.props;
    var getData = props.getData;
    if (typeof getData === 'function') {
      return getData(this.handleData);
    }
    var data = props.data;
    if (typeof data === 'function') {
      data = data();
    }
    this.handleData(data);
  },
  handleData: function(data) {
    var props = this.props;
    var onComplete = props.onComplete;
    dataCenter.saveToService({
      type: props.type,
      data: data,
      isShare: true
    }, function(data) {
      var hasError = !data || data.ec !== 0;
      hasError && message.error(data.em || 'Share failed');
      if (typeof onComplete === 'function') {
        onComplete(hasError, data);
      }
    });
  },
  render: function () {
    if (!dataCenter.tokenId) {
      return null;
    }
    return (
      <button
        onClick={this.save}
        className="btn btn-warning w-save-to-service-btn"
        draggable="false"
        disabled={this.props.disabled}
      >
        <span className="glyphicon glyphicon-cloud" />
        Share Via URL
      </button>
    );
  }
});

module.exports = ServiceBtn;
