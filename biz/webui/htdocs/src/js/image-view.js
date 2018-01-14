require('../css/image-view.css');
var React = require('react');
var util = require('./util');

var ImageView = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  render: function() {
    var props = this.props;
    return (
      <div className={'fill w-image-view' + (props.hide ? ' hide' : '')}>
        <img src={props.imgSrc} />
      </div>
    );
  }
});

module.exports = ImageView;
