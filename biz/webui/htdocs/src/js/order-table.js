var React = require('react');
var getHide = require('./util').getHide;

var OrderTable = React.createClass({
  scrollToTop: function() {
    this.refs.body.scrollTop = 0;
  },
  render: function() {
    var self = this;
    var props = self.props;
    var rowKey = props.rowKey || 'key';
    var cols = props.cols || [];
    var rows = props.rows || [];
    var emptyUrl = props.emptyUrl;

    return (
      <div className={'w-order-table fill vertical-box' + getHide(props.hide)}>
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
        <div ref="body" className="w-order-table-body fill">
          <table className="table">
            <tbody className="w-hover-body">
              {rows.length ? rows.map(function(row, i) {
                return (
                  <tr key={row[rowKey] || i} className={(row.className || '') + (' w-tr-' + (row.checked ? 'checked' : 'unchecked'))}>
                    <th>{i + 1}</th>
                    {cols.map(function(col) {
                      var name = col.name;
                      return <td key={name} style={{ width: col.width }} className={col.className}>{row[name]}</td>;
                    })}
                  </tr>
                );
              }) : <tr><td colSpan={cols.length + 1} className="w-empty">
                  {props.loading ? 'Loading...' : (emptyUrl ? <a href={emptyUrl} target="_blank">No data</a> : 'No data')}
                </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = OrderTable;
