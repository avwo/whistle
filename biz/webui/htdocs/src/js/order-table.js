var React = require('react');

var OrderTable = React.createClass({
  render: function() {
    var props = this.props;
    var rowKey = props.rowKey || 'key';
    var cols = props.cols || [];
    var rows = props.rows || [];
    var emptyUrl = props.emptyUrl;

    return (
      <div className={'w-order-table fill vertical-box' + (props.hide ? ' hide' : '')}>
         <table className="table w-order-table-head">
          <thead>
            <tr>
              <th>#</th>
              {cols.map(function(col) {
                return <th key={col.name} style={{ width: col.width }}>{col.title || col.name}</th>;
              })}
            </tr>
          </thead>
        </table>
        <div className="w-order-table-body fill">
           <table className="table">
            <tbody>
              {rows.length ? rows.map(function(row, i) {
                return (
                  <tr key={row[rowKey] || i}>
                    <th>{i + 1}</th>
                    {cols.map(function(col) {
                      var name = col.name;
                      return <td key={name} style={{ width: col.width }} className={col.className}>{row[name]}</td>;
                    })}
                  </tr>
                );
              }) : <tr><td colSpan={cols.length + 1} className="w-empty">
                  {emptyUrl ? <a href={emptyUrl} target="_blank">Empty</a> : 'Empty'}
                </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = OrderTable;
