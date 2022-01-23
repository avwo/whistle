var React = require('react');

var Favorites = React.createClass({
  render: function () {
    return (
      <div className={this.props.hide ? 'hide' : undefined}>Favorites</div>
    );
  }
});

module.exports = Favorites;
