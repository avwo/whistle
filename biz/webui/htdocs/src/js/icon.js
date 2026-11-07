var React = require('react');

var Icon = React.createClass({
  render: function() {
    var props = this.props;
    var className = props.className;

    return <span
      className={'glyphicon glyphicon-' + props.name + (className ? ' ' + className : '')}
      data-name={props['data-name']}
      data-clipboard-text={props['data-clipboard-text']}
      title={props.title}
      onClick={props.onClick}
    />;
  }
});

module.exports = Icon;
