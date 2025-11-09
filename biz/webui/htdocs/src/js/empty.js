var React = require('react');

var Empty = React.createClass({
  render: function () {
    return (
      <div className={'box fill w-empty-data' + (this.props.hide ? ' hide' : '')}>Empty</div>
    );
  }
});

module.exports = Empty;
