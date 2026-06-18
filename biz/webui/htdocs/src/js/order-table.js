var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;


var ACTIVE_COL = { width: 55 };

var OrderTable = React.createClass({
  scrollToTop: function() {
    findDOMNode(this.refs.body).scrollTop = 0;
  },
  onChange: function(e) {
    var index = e.target.getAttribute('data-index');
    var props = this.props;
    var row = props.rows[index];
    props.onActive(e.target.checked, row);
  },
  render: function() {
    var self = this;
    var props = self.props;
    var rowKey = props.rowKey || 'key';
    var cols = props.cols || [];
    var rows = props.rows || [];
    var onActive = props.onActive;
    var emptyUrl = props.emptyUrl;

    return (
      <div className={'w-order-table fill vertical-box' + (props.hide ? ' hide' : '')}>
        <table className="table w-order-table-head">
          <thead>
            <tr>
              <th>#</th>
              {onActive ? <th style={ACTIVE_COL}>Active</th> : null}
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
                    {onActive ? <td style={ACTIVE_COL} className="w-center"><input type="checkbox" checked={row.checked} data-index={i} onChange={self.onChange} /></td> : null}
                    {cols.map(function(col) {
                      var name = col.name;
                      return <td key={name} style={{ width: col.width }} className={col.className}>{row[name]}</td>;
                    })}
                  </tr>
                );
              }) : <tr><td colSpan={cols.length + 1} className="w-empty">
                  {props.loading ? 'Loading...' : (emptyUrl ? <a href={emptyUrl} target="_blank">Empty</a> : 'Empty')}
                </td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
});

module.exports = OrderTable;
