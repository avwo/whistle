var React = require('react');

var CloseBtn = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var props = this.props;
    return props.onClick !== nextProps.onClick || props.className !== nextProps.className;
  },
  render: function() {
    var onClick = this.props.onClick;
    return <button
            type="button"
            className={'close ' + (this.props.className || '')}
            data-dismiss={onClick ? null : 'modal'}
            onClick={onClick}>&times;</button>;
  }
});

module.exports = CloseBtn;
