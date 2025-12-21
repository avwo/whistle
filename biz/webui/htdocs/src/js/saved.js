var React = require('react');
var OrderTable = require('./order-table');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
var message = require('./message');
var win = require('./win');

var COLS = [
  { name: 'date', title: 'Date', width: 200 },
  { name: 'displayName', title: 'Filename' },
  { name: 'operation', title: 'Operation', width: 180 }
];

var descSorter = function(a, b) {
  var flag = b.time - a.time;
  if (flag === 0) {
    return 0;
  }
  return flag > 0 ? 1 : -1;
};

var Saved = React.createClass({
  getInitialState: function () {
    return {
      rows: [],
      loading: true
    };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    if (hide != util.getBoolean(nextProps.hide)) {
      !hide && this.loadDebounce();
      return true;
    }
    return !hide;
  },
  componentDidMount: function () {
    this.loadData();
    events.on('savedSessionsChanged', this.loadData);
  },
  onImport: function(e) {
    var self = this;
    var index = e.target.parentNode.getAttribute('data-index');
    var item = self.state.rows[index];
    self.loadSessions(item, function(sessions) {
      dataCenter.addNetworkList(sessions);
      message.success('Sessions imported successfully');
    });
  },
  onExport: function(e) {
    var index = e.target.parentNode.getAttribute('data-index');
    var item = this.state.rows[index];
    item && this.loadSessions(item, function(sessions) {
      events.trigger('exportSessions', [sessions, item.filename]);
    });
  },
  onRemove: function(e) {
    var self = this;
    var target = e.target;
    var index = target.parentNode.getAttribute('data-index');
    var rows = self.state.rows;
    var item = rows[index];
    item && win.confirm('Do you confirm the deletion of the saved sessions' +
      (item.filename ? ' \'' + item.filename + '\'' : '') + '?', function(sure) {
      if (!sure) {
        return;
      }
      dataCenter.removeSavedSessions(JSON.stringify({
        filename: item.filename,
        time: item.time,
        count: item.count
      }), function (data, xhr) {
        if (!data) {
          return util.showSystemError(xhr);
        }
        if (data.ec) {
          return message.error(data.em || 'Error occurred when removing saved sessions');
        }
        message.success('Saved sessions removed successfully');
        index = rows.indexOf(item);
        if (index !== -1) {
          rows.splice(index, 1);
        }
        self.setState({ rows: rows });
        self.loadDebounce();
      });
    });
  },
  loadSessions: function(item, callback) {
    item && dataCenter.getSavedSessions({
      filename: item.filename,
      time: item.time,
      count: item.count
    }, function (data, xhr) {
      if (!data) {
        return util.showSystemError(xhr);
      }
      if (!Array.isArray(data)) {
        return message.error('Error occurred when loading saved sessions');
      }
      callback(data);
    });
  },
  loadDebounce: function() {
    var self = this;
    clearTimeout(this.loadTimer);
    this.loadTimer = setTimeout(function() {
      self.loadData(true);
    }, 600);
  },
  loadData: function(debounce) {
    var self = this;
    dataCenter.getSavedListSafe(function(list) {
      self.setState({ rows: list.sort(descSorter).map(function(item, i) {
        var filename = item.filename || '';
        item.date = util.toLocaleString(new Date(item.time));
        item.key = filename + '_' + item.count + '_' + item.time;
        item.displayName = (filename ? filename + ' ' : '') + '(' + item.count + ')';
        item.operation = (<div className="w-order-table-operation" data-index={i}>
          <a onClick={self.onImport}>Import</a>
          <a onClick={self.onExport}>Export</a>
          <a onClick={self.onRemove} className="w-delete">Delete</a>
        </div>);
        return item;
      }), loading: false }, debounce === true ? null : function() {
        self.refs.orderTable.scrollToTop();
      });
    });
  },
  render: function () {
    var props = this.props;
    return <OrderTable ref="orderTable" cols={COLS} rows={this.state.rows} hide={props.hide} loading={this.state.loading} />;
  }
});

module.exports = Saved;
