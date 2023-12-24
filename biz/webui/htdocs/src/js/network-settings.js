require('./base-css.js');
require('../css/network-settings.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var NetworkModal = require('./network-modal');
var Dialog = require('./dialog');
var columns = require('./columns');
var dataCenter = require('./data-center');
var events = require('./events');
var util = require('./util');
var win = require('./win');
var storage = require('./storage');

var NOT_EMPTY_STYLE = { backgroundColor: 'lightyellow' };
var NOT_EMPTY_RE = /[^\s]/;

var Settings = React.createClass({
  getInitialState: function () {
    var dragger = columns.getDragger();
    dragger.onDrop = dragger.onDrop.bind(this);
    return $.extend(this.getNetworkSettings(), { dragger: dragger });
  },
  getNetworkSettings: function () {
    return $.extend(dataCenter.getFilterText(), {
      columns: columns.getAllColumns()
    });
  },
  onColumnsResort: function () {
    events.trigger('onColumnsChanged');
    this.setState({ columns: columns.getAllColumns() });
  },
  resetColumns: function () {
    var self = this;
    win.confirm('Are you sure to reset the columns of network table?', function(sure) {
      if (sure) {
        columns.reset();
        self.onColumnsResort();
      }
    });
  },
  componentDidMount: function () {
    var self = this;
    events.on('toggleTreeView', function () {
      self.setState({});
    });
    events.on('setNetworkSettings', function(_, settings) {
      if (!settings) {
        return;
      }
      win.confirm('Are you sure to modify network settings?', function(sure) {
        if (sure) {
          self.setSettings(settings);
        }
      });
    });
  },
  onNetworkSettingsChange: function (e) {
    var target = e.target;
    var name = target.getAttribute('data-name');
    if (!name || name === 'path') {
      return;
    }
    if (name === 'viewOwn') {
      dataCenter.setOnlyViewOwnData(target.checked);
      this.setState({});
      events.trigger('filterChanged');
      return;
    }
    if (name === 'treeView') {
      events.trigger('switchTreeView');
      return;
    }
    if (name === 'viewAllInNewWindow') {
      storage.set('viewAllInNewWindow', target.checked ? '1' : '');
      return this.setState({});
    }
    if (name === 'disabledHNR') {
      storage.set('disabledHNR', target.checked ? '' : '1');
      return this.setState({});
    }
    var settings = this.state;
    var filterTextChanged;
    var columnsChanged;
    switch (name) {
    case 'filter':
      settings.disabledFilterText = !target.checked;
      filterTextChanged = true;
      break;
    case 'excludeFilter':
      settings.disabledExcludeText = !target.checked;
      filterTextChanged = true;
      break;
    case 'filterText':
      filterTextChanged = true;
      settings.filterText = target.value;
      break;
    case 'excludeText':
      filterTextChanged = true;
      settings.excludeText = target.value;
      break;
    case 'networkColumns':
      columnsChanged = true;
      break;
    default:
      columns.setSelected(name, target.checked);
      columnsChanged = true;
    }
    if (filterTextChanged) {
      dataCenter.setFilterText(settings);
      events.trigger('filterChanged');
    } else if (columnsChanged) {
      events.trigger('onColumnsChanged');
    }
    this.setState(settings);
  },
  onFilterKeyDown: function (e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 88) {
      e.stopPropagation();
    }
  },
  onRowsChange: function (e) {
    NetworkModal.setMaxRows(e.target.value);
  },
  showDialog: function () {
    var settings = this.getNetworkSettings();
    this.setState(settings);
    this.refs.networkSettingsDialog.show();
  },
  hideDialog: function () {
    this.refs.networkSettingsDialog.hide();
  },
  editCustomCol: function (e) {
    e.preventDefault();
    var self = this;
    self.refs.editCustomColumn.show();
    var name = e.target.getAttribute('data-name');
    var lname = name.toLowerCase();
    self.setState(
      {
        name: name,
        value: dataCenter[lname],
        key: dataCenter[lname + 'Key'] || '',
        nameChanged: false
      },
      function () {
        setTimeout(function () {
          var input = ReactDOM.findDOMNode(self.refs.newColumnName);
          input.select();
          input.focus();
        }, 360);
      }
    );
  },
  onNameChange: function (e) {
    var value = e.target.value;
    this.setState({
      value: value.trim(),
      nameChanged: true
    });
  },
  onKeyChange: function(e) {
    var value = e.target.value;
    this.setState({
      key: value.replace(/\s+/, ''),
      nameChanged: true
    });
  },
  setCustomColumn: function(name, key, value) {
    var self = this;
    dataCenter.setCustomColumn(
      {
        name: name,
        value: value,
        key: key
      },
      function (data, xhr) {
        if (!data) {
          util.showSystemError(xhr);
          return;
        }
        self.refs.editCustomColumn.hide();
        var lname = name.toLowerCase();
        dataCenter[lname] = value || name;
        dataCenter[lname + 'Key'] = key;
        self.setState({});
        events.trigger('onColumnTitleChange');
      }
    );
  },
  changeName: function () {
    var state = this.state;
    this.setCustomColumn(state.name, state.key, state.value);
  },
  setSettings: function(settings) {
    if (!settings) {
      return;
    }
    var self = this;
    var state = self.state;
    var filterTextChanged;
    var filterChanged;
    var columnsChanged;
    var viewOwn = settings.viewOwn;
    if (util.isBool(viewOwn) && dataCenter.isOnlyViewOwnData() !== viewOwn) {
      dataCenter.setOnlyViewOwnData(viewOwn);
      filterChanged = true;
    }
    var treeView = settings.treeView;
    if (util.isBool(treeView) && treeView !== (storage.get('isTreeView') === '1')) {
      events.trigger('switchTreeView');
    }

    var viewInWin = settings.viewAllInWindow;
    if (util.isBool(viewInWin) && viewInWin !== (storage.get('viewAllInNewWindow') === '1')) {
      storage.set('viewAllInNewWindow', viewInWin ? '1' : '');
    }

    var disabledHNR = settings.disabledHNR;
    if (util.isBool(disabledHNR) && disabledHNR !== (storage.get('disabledHNR') === '1')) {
      storage.set('disabledHNR', disabledHNR ? '1' : '');
    }
    
    var disabledFilterText = settings.disabledFilterText;
    if (util.isBool(disabledFilterText) && disabledFilterText !== !!state.disabledFilterText) {
      state.disabledFilterText = disabledFilterText;
      filterTextChanged = true;
    }

    var disabledExcludeText = settings.disabledExcludeText;
    if (util.isBool(disabledExcludeText) && disabledExcludeText !== !!state.disabledExcludeText) {
      state.disabledExcludeText = disabledExcludeText;
      filterTextChanged = true;
    }

    var excludeText = settings.excludeText;
    if (util.isString(excludeText) && excludeText !== state.excludeText) {
      state.excludeText = excludeText;
      filterTextChanged = true;
    }
  
    var filterText = settings.filterText;
    if (util.isString(filterText) && filterText !== state.filterText) {
      state.filterText = filterText;
      filterTextChanged = true;
    }


    var list = settings.columns;
    if (Array.isArray(list)) {
      state.columns.forEach(function(col) {
        var selected = list.indexOf(col.name) !== -1;
        if (col.selected !== selected) {
          columnsChanged = true;
          columns.setSelected(col.name, selected);
        }
      });
    }
    if (settings.maxRows > 0) {
      NetworkModal.setMaxRows(settings.maxRows);
    }

    if (filterTextChanged || filterChanged) {
      if (filterTextChanged) {
        dataCenter.setFilterText(state);
      }
      events.trigger('filterChanged');
    } else if (columnsChanged) {
      events.trigger('onColumnsChanged');
    }
    this.setState({});
    
    ['Custom1', 'Custom2'].forEach(function(name) {
      var lname = name.toLowerCase();
      var keyName = lname + 'Key';
      var value = settings[lname];
      var key = settings[keyName] || '';
      if (util.isString(value) && util.isString(key)) {
        value = value.trim();
        key = key.trim();
        if (value && (dataCenter[lname] !== value || (dataCenter[keyName] || '') !== key)) {
          self.setCustomColumn(name, key, value);
        }
      }
    });
  },
  import: function(e) {
    events.trigger('importSessions', e);
  },
  export: function() {
    var state = this.state;
    var columns = [];
    state.columns.forEach(function(col) {
      if (col.selected) {
        columns.push(col.name);
      }
    });
    var settings = {
      type: 'setNetworkSettings',
      disabledExcludeText: state.disabledExcludeText,
      excludeText: state.excludeText,
      disabledFilterText: state.disabledFilterText,
      filterText:  state.filterText,
      columns: columns,
      custom1: dataCenter.custom1 || 'Custom1',
      custom1Key: dataCenter.custom1Key,
      custom2: dataCenter.custom2 || 'Custom2',
      custom2Key: dataCenter.custom2Key,
      maxRows: NetworkModal.getMaxRows(),
      viewOwn: dataCenter.isOnlyViewOwnData(),
      viewAllInWindow: storage.get('viewAllInNewWindow') === '1',
      treeView: storage.get('isTreeView') === '1',
      disabledHNR: storage.get('disabledHNR') === '1'
    };
    events.trigger('download', {
      name: 'network_settings_' + Date.now() + '.txt',
      value: JSON.stringify(settings, null, '  ')
    });
  },
  render: function () {
    var self = this;
    var state = self.state;
    var columnList = state.columns;
    var isTreeView = storage.get('isTreeView') === '1';
    var viewAllInNewWindow = storage.get('viewAllInNewWindow') === '1';

    return (
      <Dialog ref="networkSettingsDialog" wstyle="w-network-settings-dialog">
        <div onChange={self.onNetworkSettingsChange} className="modal-body">
          <button
            type="button"
            className="close"
            data-dismiss="modal"
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
          <fieldset className="network-settings-filter">
            <legend>
              <label>
                <input
                  checked={!state.disabledExcludeText}
                  data-name="excludeFilter"
                  type="checkbox"
                />
                Exclude Filter
              </label>
              <a
                className="w-help-menu"
                title="Click here to learn how to use the filter"
                href="https://avwo.github.io/whistle/webui/filter.html"
                target="_blank"
              >
                <span className="glyphicon glyphicon-question-sign"></span>
              </a>
            </legend>
            <textarea
              disabled={state.disabledExcludeText}
              onKeyDown={self.onFilterKeyDown}
              value={state.excludeText}
              data-name="excludeText"
              placeholder="Type filter text"
              style={!state.disabledExcludeText && NOT_EMPTY_RE.test(state.excludeText) ? NOT_EMPTY_STYLE : undefined}
              maxLength={dataCenter.MAX_EXCLUDE_LEN}
            />
          </fieldset>
          <fieldset className="network-settings-filter">
            <legend>
              <label>
                <input
                  checked={!state.disabledFilterText}
                  data-name="filter"
                  type="checkbox"
                />
                Include Filter
              </label>
              <a
                className="w-help-menu"
                title="Click here to learn how to use the filter"
                href="https://avwo.github.io/whistle/webui/filter.html"
                target="_blank"
              >
                <span className="glyphicon glyphicon-question-sign"></span>
              </a>
            </legend>
            <textarea
              disabled={state.disabledFilterText}
              onKeyDown={self.onFilterKeyDown}
              value={state.filterText}
              data-name="filterText"
              placeholder="Type filter text"
              style={!state.disabledFilterText && NOT_EMPTY_RE.test(state.filterText) ? NOT_EMPTY_STYLE : undefined}
              maxLength={dataCenter.MAX_INCLUDE_LEN}
            />
          </fieldset>
          <fieldset className="network-settings-columns">
            <legend>
              <label>Network Columns</label>
              <label onClick={self.resetColumns} className="btn btn-default">
                Reset
              </label>
            </legend>
            {columnList.map(function (col) {
              if (col.isPlugin) {
                return;
              }
              var name = col.name;
              var canEdit1 = name === 'custom1';
              var canEdit = canEdit1 || name === 'custom2';
              var title;
              if (canEdit) {
                title = canEdit1 ? dataCenter.custom1 : dataCenter.custom2;
              } else {
                title = col.title;
              }
              return (
                <label
                  {...state.dragger}
                  data-name={name}
                  draggable={true}
                  key={name}
                >
                  <input
                    disabled={col.locked}
                    checked={!!col.selected || !!col.locked}
                    data-name={name}
                    type="checkbox"
                  />
                  {canEdit ? (
                    <span title={title} className="w-network-custom-col">
                      {title}
                    </span>
                  ) : (
                    title
                  )}
                  {canEdit ? (
                    <span
                      onClick={self.editCustomCol}
                      data-name={col.title}
                      title={'Edit ' + col.title}
                      className="glyphicon glyphicon-edit"
                    />
                  ) : undefined}
                </label>
              );
            })}
          </fieldset>

          <label className="w-network-settings-own">
            Max Rows Number:
            <select
              className="form-control"
              onChange={self.onRowsChange}
              value={NetworkModal.getMaxRows()}
            >
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="1500">1500</option>
              <option value="2000">2000</option>
              <option value="2500">2500</option>
              <option value="3000">3000</option>
            </select>
          </label>
          <label className="w-network-settings-own">
            <input
              checked={dataCenter.isOnlyViewOwnData()}
              data-name="viewOwn"
              type="checkbox"
            />
            Only view the requests of own computer (IP: {dataCenter.clientIp})
          </label>
          <label className="w-network-settings-own">
            <input checked={viewAllInNewWindow} data-name="viewAllInNewWindow" type="checkbox" />
            ViewAll in a new window
          </label>
          <label className="w-network-settings-own">
            <input checked={isTreeView} data-name="treeView" type="checkbox" />
            <span
              className="glyphicon glyphicon-tree-conifer"
              style={{ marginRight: 2 }}
            ></span>
            Show Tree View (Ctrl[Command] + B)
          </label>
          {isTreeView ? (
            <label style={{textIndent: 20}} className="w-network-settings-own">
              <input
                checked={storage.get('disabledHNR') !== '1'}
                data-name="disabledHNR"
                type="checkbox"
              />
              Highlight new requests
            </label>
          ) : null}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-default"
            onClick={self.import}
          >
            Import
          </button>
          <button
            type="button"
            className="btn btn-info"
            onClick={self.export}
          >
            Export
          </button>
          <button
            type="button"
            className="btn btn-default"
            data-dismiss="modal"
          >
            Close
          </button>
        </div>
        <Dialog ref="editCustomColumn" wstyle="w-network-settings-edit">
          <div onChange={self.onNetworkSettingsChange} className="modal-body">
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <label>
              <span>Column Name:</span>
              <input
                onChange={this.onNameChange}
                ref="newColumnName"
                value={state.value}
                className="form-control"
                maxLength="16"
                placeholder="Input the custom column name"
              />
            </label>
            <label>
            <span>Data Key:</span>
              <input
                onChange={this.onKeyChange}
                value={state.key}
                className="form-control"
                maxLength="72"
                placeholder="Input the key of data (as: res.headers.x-server ...)"
              />
            </label>
          </div>
          <div className="modal-footer">
            <button
              disabled={!state.nameChanged}
              onClick={self.changeName}
              type="button"
              className="btn btn-primary"
            >
              Confirm
            </button>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Cancel
            </button>
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

module.exports = Settings;
