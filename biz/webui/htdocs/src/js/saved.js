var React = require('react');
var OrderTable = require('./order-table');

var COLS = [
  { name: 'date', title: 'Date', width: 180 },
  { name: 'filename', title: 'Filename' },
  { name: 'operation', title: 'Operation', className: 'w-table-cell-middle', width: 180 }
];

var Saved = React.createClass({
  getInitialState: function () {
    return {
      rows: []
    };
  },
  componentDidMount: function () {
    var self = this;
    setTimeout(function () {
      self.setState({ rows: [
        {
          date: '2024-06-01 10:00:00.123',
          filename: 'My Saved Data 1My Saved Data 1My Saved Data 1My Saved Data 1My Saved Data 1My Saved Data 1My Saved Data 1',
          operation: <div className="w-order-table-operation"><a>Import</a><a>Export</a><a className="w-delete">Delete</a></div>
        },
        {
          date: '2024-06-02 11:00:00.456',
          operation: <div className="w-order-table-operation"><a>Import</a><a>Export</a><a className="w-delete">Delete</a></div>
        }
      ]});
    }, 100);
  },
  render: function () {
    var props = this.props;
    return <OrderTable cols={COLS} rows={this.state.rows} hide={props.hide} />;
  }
});

module.exports = Saved;
