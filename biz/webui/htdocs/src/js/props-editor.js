require('./base-css.js');
require('../css/props-editor.css');
var React = require('react');

var PropsEditor = React.createClass({

  render: function() {
    var props = this.props;
    return (
      <ul className={'fill orient-vertical-box w-props-editor' + (props.hide ? ' hide' : '')}>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
        <li>Hello</li>
      </ul>
    );
  }
});

module.exports = PropsEditor;
