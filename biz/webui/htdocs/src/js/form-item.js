var React = require('react');

var FormItem = React.createClass({
  render: function () {
    return (
      <div className="w-form-item">
        <div className="w-form-value">
          {this.props.children}
        </div>
      </div>
    );
  }
});

module.exports = FormItem;
