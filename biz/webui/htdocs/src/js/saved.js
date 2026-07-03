var React = require('react');
var OrderTable = require('./order-table');
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var win = require('./win');

var COLS = [
  { name: 'date', title: 'Date', width: 200 },
  { name: 'displayName', title: 'Filename (Count)' },
  { name: 'operation', title: 'Operation', width: 170 }
];

var descSorter = function(a, b) {
  var flag = b.time - a.time;
  if (flag === 0) {
    return 0;
  }
  return flag > 0 ? 1 : -1;
};

var getIndex = function(e) {
  return e.target.parentNode.getAttribute('data-index');
};

var Saved = React.createClass({
  getInitialState: function () {
    return {
      rows: [],
      loading: true
    };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBool(this.props.hide);
    if (hide != util.getBool(nextProps.hide)) {
      !hide && this.loadDebounce();
      return true;
    }
    return !hide;
  },
  componentDidMount: function () {
    this.loadData();
    util.on('savedSessionsChanged', this.loadData);
  },
  onImport: function(e) {
    var self = this;
    var index = getIndex(e);
    var item = self.state.rows[index];
    self.loadSessions(item, function(sessions) {
      dataCenter.addNetworkList(sessions);
      message.success('Sessions imported successfully');
    });
  },
  onExport: function(e) {
    var index = getIndex(e);
    var item = this.state.rows[index];
    item && this.loadSessions(item, function(sessions) {
      util.trigger('exportSessions', [sessions, item.filename]);
    });
  },
  onRemove: function(e) {
    var self = this;
    var index = getIndex(e);
    var rows = self.state.rows;
    var item = rows[index];
    item && win.confirm(util.CMF_DEL_MSG + 'the saved sessions' +
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
          return util.showSysErr(xhr);
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
        return util.showSysErr(xhr);
      }
      if (!Array.isArray(data)) {
        return message.error('Error occurred when loading saved sessions');
      }
      callback(data);
    });
  },
  loadDebounce: function() {
    var self = this;
    clearTimeout(self.loadTimer);
    self.loadTimer = setTimeout(function() {
      self.loadData(true);
    }, 600);
  },
  loadData: function(debounce) {
    var self = this;
    dataCenter.getSavedListSafe(function(list) {
      self.setState({ rows: list.sort(descSorter).map(function(item, i) {
        var filename = item.filename || '';
        item.date = util.toDateStr(item.time);
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
    var self = this;
    var state = self.state;
    return <OrderTable ref="orderTable" cols={COLS} rows={state.rows} hide={self.props.hide} loading={state.loading} />;
  }
});

module.exports = Saved;
