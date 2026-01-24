var React = require('react');
var dataCenter = require('./data-center');
var message = require('./message');
var util = require('./util');
var Icon = require('./icon');

var ShareBtn = React.createClass({
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
    var type = props.type + 'Share';
    dataCenter.saveToService({
      type: type,
      filename: typeof props.getFilename === 'function' ? props.getFilename() : props.filename,
      data: data,
      isShare: true
    }, function(data) {
      var hasError = !data || data.ec !== 0;
      if (typeof onComplete === 'function') {
        onComplete(hasError, data);
      }
      if (hasError) {
        message.error((data && data.em) || 'Sharing failed');
      } else {
        message.success('Shared successfully');
        util.showService(type, true);
      }
    });
  },
  render: function () {
    if (!dataCenter.whistleId) {
      return null;
    }
    return (
      <button
        onClick={this.save}
        className="btn btn-warning w-save-to-service-btn"
        draggable="false"
        disabled={this.props.disabled}
      >
        <Icon name="cloud" />
        Share Via URL
      </button>
    );
  }
});

module.exports = ShareBtn;
