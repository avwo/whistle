var React = require('react');

var QRCodeTool = React.createClass({

  render: function() {
    return (
      <div className={this.props.hide ? 'hide' : undefined}>
        QRCodeTool
      </div>
    );
  }
});

module.exports = QRCodeTool;
