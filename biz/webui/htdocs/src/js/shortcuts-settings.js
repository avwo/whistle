var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var dataCenter = require('./data-center');

var ShortcutsSettings = React.createClass({
  getInitialState: function() {
    return { settings: util.shortcutsSettings };
  },
  show: function() {
    this.refs.dialog.show();
  },
  hide: function() {
    this.refs.dialog.hide();
  },
  onChange: function(e) {
    var target = e.target;
    if (target.nodeName !== 'INPUT') {
      return;
    }
    var checked = target.checked;
    var name = target.getAttribute('data-name');
    var settings = this.state.settings;
    settings[name] = checked;
    this.setState({ settings: settings });
    util.saveShortcutsSettings();
  },
  render: function() {
    var settings = this.state.settings;

    return (
      <Dialog ref="dialog" wstyle="w-shortcuts">
        <div>
          <div className="modal-header">
            <h4>
              Shortcuts Settings
            </h4>
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body" onChange={this.onChange}>
            <h5>Network</h5>
            <label>
              <input type="checkbox" data-name="importNetwork" checked={settings.importNetwork !== false} /> <strong>Ctrl[Command] + I :</strong> Import network sessions
            </label>
            <label>
              <input type="checkbox" data-name="exportNetwork" checked={settings.exportNetwork !== false} /> <strong>Ctrl[Command] + E :</strong> Export network sessions
            </label>
            <label>
              <input type="checkbox" data-name="saveNetwork" checked={settings.saveNetwork !== false} /> <strong>Ctrl[Command] + S :</strong> Save network sessions
            </label>
            <label>
              <input type="checkbox" data-name="toggleNetworkState" checked={settings.toggleNetworkState !== false} /> <strong>Ctrl[Command] + O :</strong> Turn captured requests ON or OFF
            </label>
            <label>
              <input type="checkbox" data-name="toggleNetworkPanelLayout" checked={settings.toggleNetworkPanelLayout !== false} /> <strong>Ctrl[Command] + L :</strong> Toggle Network Panel layout: Left-right or top-bottom
            </label>
            <label>
              <input type="checkbox" data-name="openNetworkSettings" checked={settings.openNetworkSettings !== false} /> <strong>Ctrl[Command] + . :</strong> Open network settings
            </label>
            <label>
              <input type="checkbox" data-name="removeNetworkSessions" checked={settings.removeNetworkSessions !== false} /> <strong>Ctrl[Command] + D :</strong> Remove selected network sessions
            </label>
            <label>
              <input type="checkbox" data-name="switchNetworkView" checked={settings.switchNetworkView !== false} /> <strong>Ctrl[Command] + B :</strong> Switch between tree and list view of network sessions
            </label>
             <label>
              <input type="checkbox" data-name="replaySelectedRequests" checked={settings.replaySelectedRequests !== false} /> <strong>Ctrl[Command] + Enter :</strong> Replay selected requests
            </label>
            <label>
              <input type="checkbox" data-name="replaySelectedRequestsTimes" checked={settings.replaySelectedRequestsTimes !== false} /> <strong>Ctrl[Command] + Shift + Enter :</strong> Set the number of times to replay the selected requests
            </label>
            <label>
              <input type="checkbox" data-name="abortRequest" checked={settings.abortRequest !== false} /> <strong>Ctrl[Command] + A :</strong> Abort requests
            </label>
            <label>
              <input type="checkbox" data-name="clearNetworkSessions" checked={settings.clearNetworkSessions !== false} /> <strong>Ctrl[Command] + X :</strong> Clear network sessions
            </label>
            <label>
              <input type="checkbox" data-name="focusNetworkSearchBox" checked={settings.focusNetworkSearchBox !== false} /> <strong>/ :</strong> Focus the network search box at the bottom
            </label>

            <h5>Frames</h5>
            <label>
              <input type="checkbox" data-name="replaySelectedFrame" checked={settings.replaySelectedFrame !== false} /> <strong>Ctrl[Command] + Enter :</strong> Replay selected frame
            </label>
            <label>
              <input type="checkbox" data-name="clearNetworkFrames" checked={settings.clearNetworkFrames !== false} /> <strong>Ctrl[Command] + X :</strong> Import rules
            </label>

            <h5>Rules</h5>
            <label>
              <input type="checkbox" data-name="importRules" checked={settings.importRules !== false} /> <strong>Ctrl[Command] + I :</strong> Import rules
            </label>
            <label>
              <input type="checkbox" data-name="exportRules" checked={settings.exportRules !== false} /> <strong>Ctrl[Command] + E :</strong> Export rules
            </label>
            <label>
              <input type="checkbox" data-name="saveRulesChanges" checked={settings.saveRulesChanges !== false} /> <strong>Ctrl[Command] + S :</strong> Save rules changes
            </label>
            <label>
              <input type="checkbox" data-name="toggleRules" checked={settings.toggleRules !== false} /> <strong>Ctrl[Command] + O :</strong>  Turn rules ON or OFF
            </label>
            <label>
              <input type="checkbox" data-name="toggleRulesNum" checked={settings.toggleRulesNum !== false} /> <strong>Ctrl[Command] + L :</strong> Toggle line numbers
            </label>
            <label>
              <input type="checkbox" data-name="openRulesSettings" checked={settings.openRulesSettings !== false} /> <strong>Ctrl[Command] + . :</strong> Open rules settings
            </label>
            <label>
              <input type="checkbox" data-name="removeRules" checked={settings.removeRules !== false} /> <strong>Ctrl[Command] + D :</strong> Remove selected rules
            </label>
            <label>
              <input type="checkbox" data-name="focusRulesSearchBox" checked={settings.focusRulesSearchBox !== false} /> <strong>/ :</strong> Focus the rules search box at the bottom
            </label>

            <h5>Values</h5>
            <label>
              <input type="checkbox" data-name="importValues" checked={settings.importValues !== false} /> <strong>Ctrl[Command] + I :</strong> Import values
            </label>
            <label>
              <input type="checkbox" data-name="exportValues" checked={settings.exportValues !== false} /> <strong>Ctrl[Command] + E :</strong> Export values
            </label>
            <label>
              <input type="checkbox" data-name="saveValuesChanges" checked={settings.saveValuesChanges !== false} /> <strong>Ctrl[Command] + S :</strong> Save values changes
            </label>
            <label>
              <input type="checkbox" data-name="toggleValuesNum" checked={settings.toggleValuesNum !== false} /> <strong>Ctrl[Command] + L :</strong> Toggle line numbers
            </label>
            <label>
              <input type="checkbox" data-name="openValuesSettings" checked={settings.openValuesSettings !== false} /> <strong>Ctrl[Command] + . :</strong> Open values settings
            </label>
            <label>
              <input type="checkbox" data-name="removeValues" checked={settings.removeValues !== false} /> <strong>Ctrl[Command] + D :</strong> Remove selected values
            </label>
            <label>
              <input type="checkbox" data-name="focusValuesSearchBox" checked={settings.focusValuesSearchBox !== false} /> <strong>/ :</strong> Focus the values search box at the bottom
            </label>

            <h5>Plugins</h5>
            <label>
              <input type="checkbox" data-name="openInstallPlugins" checked={settings.openInstallPlugins !== false} /> <strong>Ctrl[Command] + I :</strong> Open the plugin installation dialog box
            </label>
            <label>
              <input type="checkbox" data-name="togglePlugins" checked={settings.togglePlugins !== false} /> <strong>Ctrl[Command] + O :</strong> Turn all plugins ON or OFF
            </label>

            <h5>Others</h5>
            <label>
              <input type="checkbox" data-name="switchTabReverse" checked={settings.switchTabReverse !== false} /> <strong>Ctrl[Command] + &lt;-- :</strong> Toggle Network, Rules, Values, and Plugins in reverse order
            </label>
            <label>
              <input type="checkbox" data-name="switchTab" checked={settings.switchTab !== false} /> <strong>Ctrl[Command] + --&gt; :</strong> Toggle Network, Rules, Values, and Plugins
            </label>
            {dataCenter.whistleId ?
            <label>
              <input type="checkbox" data-name="openService" checked={settings.openService !== false} /> <strong>Ctrl[Command] + J :</strong> Open service dialog
            </label> : null}
          </div>
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
    </Dialog>
  );
  }
});

module.exports = ShortcutsSettings;
