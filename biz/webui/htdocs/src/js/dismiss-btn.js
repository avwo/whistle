var React = require('react');

var DismissBtn = React.createClass({
  render: function () {
    return (
      <button
        type="button"
        className="btn btn-default"
        data-dismiss="modal"
      >
        Close
      </button>
    );
  }
});

module.exports = DismissBtn;
