require('./base-css.js');
require('../css/table.css');
var React = require('react');

var Table = React.createClass({
  render: function () {
    var head = this.props.head;
    var hasHead = Array.isArray(head) && head.length;
    var modal = this.props.modal || [];

    return (
      <table className="table w-table">
        {hasHead ? (
          <thead>
            {head.map(function (head) {
              return <th key={head}>{head}</th>;
            })}
          </thead>
        ) : (
          ''
        )}
        <tbody>
          {modal.map(function (list, i) {
            return (
              <tr key={i}>
                {list.map(function (value, j) {
                  return <td key={i + '.' + j}>{value}</td>;
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
});

module.exports = Table;
