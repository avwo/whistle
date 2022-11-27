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
  changeName: function () {
    var self = this;
    var state = self.state;
    var name = state.name;
    var value = state.value;
    var key = state.key;
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
        name = name.toLowerCase();
        dataCenter[name] = value;
        dataCenter[name + 'Key'] = key;
        self.setState({});
        events.trigger('onColumnTitleChange');
      }
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var columnList = state.columns;
    var isTreeView = storage.get('isTreeView') === '1';

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
              defaultValue={NetworkModal.getMaxRows()}
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
            <input checked={isTreeView} data-name="treeView" type="checkbox" />
            <span
              className="glyphicon glyphicon-tree-conifer"
              style={{ marginRight: 2 }}
            ></span>
            Show Tree View (Ctrl[Command] + B)
          </label>
          {isTreeView ? <br /> : null}
          {isTreeView ? (
            <label className="w-network-settings-own">
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
