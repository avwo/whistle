var React = require('react');

var Icon = React.createClass({
  shouldComponentUpdate: function (nextProps) {
    var props = this.props;
    return props.name !== nextProps.name || props.className !== nextProps.className
      || props['data-name'] !== nextProps['data-name']
      || props['data-clipboard-text'] !== nextProps['data-clipboard-text']
      || props.title !== nextProps.title
      || props.onClick !== nextProps.onClick;
  },
  render: function() {
    var props = this.props;
    return <span
      className={'glyphicon glyphicon-' + props.name + (props.className ? ' ' + props.className : '')}
      data-name={props['data-name']}
      data-clipboard-text={props['data-clipboard-text']}
      title={props.title}
      onClick={props.onClick}
    />;
  }
});

module.exports = Icon;
