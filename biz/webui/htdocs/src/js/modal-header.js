var React = require('react');
var CloseBtn = require('./close-btn');

var Header = React.createClass({
  render: function () {
    return (
      <div className="modal-header">
        <h4>{this.props.children}</h4>
        <CloseBtn />
      </div>
    );
  }
});

module.exports = Header;
