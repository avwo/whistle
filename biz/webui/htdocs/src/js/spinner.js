require('../css/spinner.css');
var React = require('react');

var Spinner = React.createClass({
  onDragStart: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },
  onClick: function(e) {
    e.stopPropagation();
  },
  render: function() {
    var order = this.props.order;
    var desc = order == 'desc';
    if (!desc && order != 'asc') {
      order = null;
    }
    return (
      <div onClick={this.onClick} onDragStart={this.onDragStart} draggable={true} className="w-spinner">
        <span className={'glyphicon glyphicon-triangle-top' + (order ? ' spinner-' + order : '')}></span>
        <span className={'glyphicon glyphicon-triangle-bottom' + (order ? ' spinner-' + order : '')}></span>
      </div>
    );
  }
});

module.exports = Spinner;
