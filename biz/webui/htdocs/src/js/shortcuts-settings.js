var React = require('react');
var Dialog = require('./dialog');
var util = require('./util');
var dataCenter = require('./data-center');
var ModalHeader = require('./modal-header');

var CMD = util.CMD;
var TOGGLE = 'Toggle Network, Rules, Values, and Plugins';
var NETWORK_SESSIONS = ' network sessions';
var SETTINGS = [
  {
    'category': 'Network',
    'list': [
      [
        'importNetwork',
        CMD + 'I',
        'Import' + NETWORK_SESSIONS
      ],
      [
        'exportNetwork',
        CMD + 'E',
        'Export' + NETWORK_SESSIONS
      ],
      [
        'saveNetwork',
        CMD + 'S',
        'Save' + NETWORK_SESSIONS
      ],
      [
        'toggleNetworkState',
        CMD + 'O',
        'Turn captured requests ON or OFF'
      ],
      [
        'toggleNetworkPanelLayout',
        CMD + 'L',
        'Toggle network panel layout: Left-right or top-bottom'
      ],
      [
        'openNetworkSettings',
        CMD + '.',
        'Open network settings'
      ],
      [
        'removeNetworkSessions',
        CMD + 'D',
        'Remove selected' + NETWORK_SESSIONS
      ],
      [
        'switchNetworkView',
        CMD + 'B',
        'Switch between tree and list view of' + NETWORK_SESSIONS
      ],
      [
        'replaySelectedRequests',
        CMD + 'Enter',
        'Replay selected requests'
      ],
      [
        'replaySelectedRequestsTimes',
        CMD + 'Shift + Enter',
        'Set the number of times to replay the selected requests'
      ],
      [
        'abortRequest',
        CMD + 'A',
        'Abort requests'
      ],
      [
        'clearNetworkSessions',
        CMD + 'X',
        'Clear' + NETWORK_SESSIONS
      ],
      [
        'focusNetworkSearchBox',
        '/',
        'Focus the network search box at the bottom'
      ]
    ]
  },
  {
    'category': 'Frames',
    'list': [
      [
        'replaySelectedFrame',
        CMD + 'Enter',
        'Replay selected frames'
      ],
      [
        'clearNetworkFrames',
        CMD + 'X',
        'Clear frames'
      ]
    ]
  },
  {
    'category': 'Rules',
    'list': [
      [
        'importRules',
        CMD + 'I',
        'Import rules'
      ],
      [
        'exportRules',
        CMD + 'E',
        'Export rules'
      ],
      [
        'saveRulesChanges',
        CMD + 'S',
        'Save rules changes'
      ],
      [
        'toggleRules',
        CMD + 'O',
        'Turn rules ON or OFF'
      ],
      [
        'toggleRulesNum',
        CMD + 'L',
        'Toggle line numbers'
      ],
      [
        'openRulesSettings',
        CMD + '.',
        'Open rules settings'
      ],
      [
        'focusRulesSearchBox',
        '/',
        'Focus the rules search box at the bottom'
      ]
    ]
  },
  {
    'category': 'Values',
    'list': [
      [
        'importValues',
        CMD + 'I',
        'Import values'
      ],
      [
        'exportValues',
        CMD + 'E',
        'Export values'
      ],
      [
        'saveValuesChanges',
        CMD + 'S',
        'Save values changes'
      ],
      [
        'toggleValuesNum',
        CMD + 'L',
        'Toggle line numbers'
      ],
      [
        'openValuesSettings',
        CMD + '.',
        'Open values settings'
      ],
      [
        'focusValuesSearchBox',
        '/',
        'Focus the values search box at the bottom'
      ]
    ]
  },
  {
    'category': 'Plugins',
    'list': [
      [
        'openInstallPlugins',
        CMD + 'I',
        'Open the plugin installation dialog box'
      ],
      [
        'togglePlugins',
        CMD + 'O',
        'Turn all plugins ON or OFF'
      ]
    ]
  },
  {
    'category': 'Others',
    'list': [
      [
        'switchTabReverse',
        CMD + '<--',
        TOGGLE + ' in reverse order'
      ],
      [
        'switchTab',
        CMD + '-->',
        TOGGLE
      ],
      [
        'openService',
        CMD + 'J',
        'Open service dialog'
      ]
    ]
  }
];

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
    var name = util.attr(target, 'data-name');
    var settings = this.state.settings;
    settings[name] = checked;
    this.setState({ settings: settings });
    util.saveShortcutsSettings();
  },
  render: function() {
    var settings = this.state.settings;

    return (
      <Dialog ref="dialog" wstyle="w-shortcuts" closable>
        <ModalHeader>
          Shortcuts Settings
        </ModalHeader>
        <div className="modal-body" onChange={this.onChange}>
          {SETTINGS.map(function(setting) {
            return (
              <div>
                <h5 key={setting.category}>{setting.category}</h5>
                {setting.list.map(function(item) {
                  if (!dataCenter.whistleId && item[0] === 'openService') {
                    return null;
                  }
                  return <label key={item[0]}>
                    <input type="checkbox" data-name={item[0]} checked={settings[item[0]] !== false} /> <strong>{item[1]} :</strong> {item[2]}
                  </label>;
                })}
              </div>
            );
          })}
        </div>
      </Dialog>
  );
  }
});

module.exports = ShortcutsSettings;
