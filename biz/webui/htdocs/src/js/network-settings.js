require('./base-css.js');
require('../css/network-settings.css');
var $ = require('jquery');
var React = require('react');

var Dialog = require('./dialog');
var columns = require('./columns');
var dataCenter = require('./data-center');
var events = require('./events');

var Settings = React.createClass({
  getInitialState: function() {
    var dragger = columns.getDragger();
    dragger.onDrop = dragger.onDrop.bind(this);
    return $.extend(this.getNetworkSettings(), { dragger: dragger });
  },
  getNetworkSettings: function() {
    return $.extend(dataCenter.getFilterText(), {
      disabledColumns: columns.isDisabled(),
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
    if (!name) {
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
      settings.disabledColumns = !target.checked;
      columns.disable(settings.disabledColumns);
      columnsChanged = true;
      break;
    default:
      columns.setselected(name, target.checked);
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
  showDialog: function() {
    var settings = this.getNetworkSettings();
    this.setState(settings);
    this.refs.networkSettingsDialog.show();
  },
  hideDialog: function() {
    this.refs.networkSettingsDialog.hide();
  },
  render: function() {
    var state = this.state;
    var disabledColumns = state.disabledColumns;
    var columnList = state.columns;

    return (
      <Dialog ref="networkSettingsDialog" wstyle="w-network-settings-dialog">
        <div onChange={this.onNetworkSettingsChange} className="modal-body">
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
              onKeyDown={this.onFilterKeyDown}
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
              onKeyDown={this.onFilterKeyDown}
              value={state.filterText} data-name="filterText"
              placeholder="type filter text" maxLength={dataCenter.MAX_INCLUDE_LEN} />
          </fieldset>
          <fieldset className="network-settings-columns">
            <legend>
              <label>
                <input checked={!disabledColumns} data-name="networkColumns" type="checkbox" />Network Columns
              </label>
              <label onClick={this.resetColumns} className="btn btn-default">Reset</label>
            </legend>
            {columnList.map(function(col) {
              return (
                <label
                  {...state.dragger}
                  data-name={col.name}
                  draggable={!disabledColumns}
                  >
                  <input disabled={disabledColumns} checked={!!col.selected} data-name={col.name} type="checkbox" />{col.title}
                </label>
              );
            })}
          </fieldset>
          <label className="w-network-settings-own">
            <input checked={dataCenter.isOnlyViewOwnData()} data-name="viewOwn" type="checkbox" />Only take this machine's request into consideration (IP: {dataCenter.clientIp})
          </label>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
    );
  }
});

module.exports = Settings;
