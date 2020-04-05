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

var Settings = React.createClass({
  getInitialState: function() {
    var dragger = columns.getDragger();
    dragger.onDrop = dragger.onDrop.bind(this);
    return $.extend(this.getNetworkSettings(), { dragger: dragger });
  },
  getNetworkSettings: function() {
    return $.extend(dataCenter.getFilterText(), {
      columns: columns.getAllColumns()
    });
  },
  onColumnsResort: function() {
    events.trigger('onColumnsChanged');
    this.setState({ columns: columns.getAllColumns() });
  },
  resetColumns: function() {
    columns.reset();
    this.onColumnsResort();
  },
  onNetworkSettingsChange: function(e) {
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
    var settings = this.state;
    var filterTextChanged;
    var columnsChanged;
    switch(name) {
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
  onFilterKeyDown: function(e) {
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 88) {
      e.stopPropagation();
    }
  },
  onRowsChange: function(e) {
    NetworkModal.setMaxRows(e.target.value);
  },
  showDialog: function() {
    var settings = this.getNetworkSettings();
    this.setState(settings);
    this.refs.networkSettingsDialog.show();
  },
  hideDialog: function() {
    this.refs.networkSettingsDialog.hide();
  },
  editCustomCol: function(e) {
    e.preventDefault();
    var self = this;
    self.refs.editCustomColumn.show();
    var name = e.target.getAttribute('data-name');
    self.setState({
      name: name,
      value: dataCenter[name.toLowerCase()],
      nameChanged: false
    }, function() {
      setTimeout(function() {
        var input = ReactDOM.findDOMNode(self.refs.newColumnName);
        input.select();
        input.focus();
      }, 360);
    });
  },
  onNameChange: function(e) {
    var value = e.target.value;
    this.setState({
      value: value.trim(),
      nameChanged: true
    });
  },
  changeName: function() {
    var self = this;
    var state = self.state;
    var name = state.name;
    var value = state.value;
    dataCenter.setCustomColumn({
      name: name,
      value: value
    }, function(data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
        return;
      }
      self.refs.editCustomColumn.hide();
      dataCenter[name.toLowerCase()] = value;
      self.setState({});
      events.trigger('onColumnTitleChange');
    });
  },
  render: function() {
    var self = this;
    var state = self.state;
    var columnList = state.columns;

    return (
      <Dialog ref="networkSettingsDialog" wstyle="w-network-settings-dialog">
        <div onChange={self.onNetworkSettingsChange} className="modal-body">
          <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
          <fieldset className="network-settings-filter">
            <legend>
              <label>
                <input checked={!state.disabledExcludeText} data-name="excludeFilter" type="checkbox" />Exclude Filter
              </label>
              <a className="w-help-menu"
                title="Click here to learn how to use the filter"
                href="https://avwo.github.io/whistle/webui/filter.html" target="_blank">
                <span className="glyphicon glyphicon-question-sign"></span>
              </a>
            </legend>
            <textarea disabled={state.disabledExcludeText}
              onKeyDown={self.onFilterKeyDown}
              value={state.excludeText} data-name="excludeText"
              placeholder="type filter text" maxLength={dataCenter.MAX_EXCLUDE_LEN} />
          </fieldset>
          <fieldset className="network-settings-filter">
            <legend>
              <label>
                <input checked={!state.disabledFilterText} data-name="filter" type="checkbox" />Include Filter
              </label>
              <a className="w-help-menu"
                title="Click here to learn how to use the filter"
                href="https://avwo.github.io/whistle/webui/filter.html" target="_blank">
                <span className="glyphicon glyphicon-question-sign"></span>
              </a>
            </legend>
            <textarea disabled={state.disabledFilterText}
              onKeyDown={self.onFilterKeyDown}
              value={state.filterText} data-name="filterText"
              placeholder="type filter text" maxLength={dataCenter.MAX_INCLUDE_LEN} />
          </fieldset>
          <fieldset className="network-settings-columns">
            <legend>
              <label>Network Columns</label>
              <label onClick={self.resetColumns} className="btn btn-default">Reset</label>
            </legend>
            {columnList.map(function(col) {
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
                  <input disabled={col.locked} checked={!!col.selected || !!col.locked} data-name={name} type="checkbox" />
                  {canEdit ? <span title={title} className="w-network-custom-col">{title}</span> : title}
                  {canEdit ? <span onClick={self.editCustomCol} data-name={col.title} title={'Edit ' + col.title}
                    className="glyphicon glyphicon-edit">{canEdit1 ? 1 : 2}</span> : undefined}
                </label>
              );
            })}
          </fieldset>

          <label className="w-network-settings-own">
            Max Rows Number:
            <select className="form-control" onChange={self.onRowsChange} defaultValue={NetworkModal.getMaxRows()}>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="1500">1500</option>
              <option value="2000">2000</option>
              <option value="2500">2500</option>
              <option value="3000">3000</option>
            </select>
          </label>
          <label className="w-network-settings-own">
            <input checked={dataCenter.isOnlyViewOwnData()} data-name="viewOwn" type="checkbox" />Only take this machine's request into consideration (IP: {dataCenter.clientIp})
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
        <Dialog
          ref="editCustomColumn"
          wstyle="w-network-settings-edit"
        >
          <div onChange={self.onNetworkSettingsChange} className="modal-body">
            <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <label>
              New {state.name} Name:
              <input onChange={this.onNameChange} ref="newColumnName" value={state.value} className="form-control"
                maxLength="16" placeholder="Input the new column name" />
            </label>
          </div>
          <div className="modal-footer">
            <button disabled={!state.nameChanged} onClick={self.changeName} type="button" className="btn btn-primary">Confirm</button>
            <button type="button" className="btn btn-default" data-dismiss="modal">Cancel</button>
          </div>
        </Dialog>
      </Dialog>
    );
  }
});

module.exports = Settings;
