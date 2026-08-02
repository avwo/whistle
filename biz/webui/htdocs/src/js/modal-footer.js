var React = require('react');
var DismissBtn = require('./dismiss-btn');

var Footer = React.createClass({
  render: function () {
    return (
      <div className="modal-footer">
        <DismissBtn />
        {this.props.children}
      </div>
    );
  }
});

module.exports = Footer;
