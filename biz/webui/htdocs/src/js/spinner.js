require('../css/spinner.css');
// var $ = require('jquery');
var React = require('react');
// var util = require('./util');

// util.addDragEvent('.w-spinner', function(target, x, y) {
//   console.log(x, y);
// });

var Spinner = React.createClass({
  // stopPropagation: function(e) {
  //   if (!$(e.target).closest('th').next('th').length) {
  //     return;
  //   }
  //   e.stopPropagation();
  //   e.preventDefault();
  // },
  render: function() {
    var order = this.props.order;
    var desc = order == 'desc';
    if (!desc && order != 'asc') {
      order = null;
    }
    return (
      <div /* onClick={this.stopPropagation} onDragStart={this.stopPropagation} */
        /* draggable={true}  */className="w-spinner">
        <span className={'glyphicon glyphicon-triangle-top' + (order ? ' spinner-' + order : '')}></span>
        <span className={'glyphicon glyphicon-triangle-bottom' + (order ? ' spinner-' + order : '')}></span>
      </div>
    );
  }
});

module.exports = Spinner;
