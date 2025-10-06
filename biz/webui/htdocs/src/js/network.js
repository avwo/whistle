require('./base-css.js');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var storage = require('./storage');
var Divider = require('./divider');
var ReqData = require('./req-data');
var Detail = require('./detail');
var events = require('./events');
var dataCenter = require('./data-center');

var getWidth = function (vertical) {
  var docElem = document.documentElement;
  if (vertical) {
    return Math.max(Math.floor(docElem.clientHeight / 2), 360);
  }
  return Math.max(Math.floor(docElem.clientWidth / 3), 572);
};

var Network = React.createClass({
  getInitialState: function () {
    var dockToBottom = storage.get('dockToBottom');
    if (dockToBottom == null && /[&#?]dockToBottom=true(?:&|$|#)/.test(window.location.search)) {
      dockToBottom = true;
    }
    return {
      dockToBottom: dockToBottom,
      rightWidth: getWidth(dockToBottom)
    };
  },
  componentDidMount: function () {
    var self = this;
    $(window)
      .on('keydown', function (e) {
        if (self.props.hide) {
          return;
        }
        if ((e.ctrlKey || e.metaKey) && e.keyCode == 68) {
          if (
            !util.isFocusEditor() &&
            !$(e.target).closest('.w-frames-list').length
          ) {
            var modal = self.props.modal;
            if (e.shiftKey) {
              if (modal && modal.removeUnselectedItems()) {
                self.setState({});
              }
            } else {
              if (modal && modal.removeSelectedItems()) {
                self.setState({});
              }
            }
          }
        }
      })
      .on('keydown', function (e) {
        if (e.keyCode === 123) {
          if (!self.props.hide) {
            self.onDockChange();
          }
          e.preventDefault();
        }
      });
    events.trigger('networkDidMount');
    events.on('toggleNetworkDock', self.onDockChange);
    events.on('shakeSavedTab', self.shakeSavedTab);
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  onDockChange: function () {
    var self = this;
    var dockToBottom = !self.state.dockToBottom;
    storage.set('dockToBottom', dockToBottom ? 1 : '');
    self.setState(
      {
        dockToBottom: dockToBottom,
        rightWidth: getWidth(dockToBottom)
      },
      function () {
        self.refs.divider.reset();
      }
    );
  },
  shakeSavedTab: function() {
    util.shakeElem($(ReactDOM.findDOMNode(this.refs.savedTab)));
  },
  switchTab: function(e) {
    var name = e.target.getAttribute('data-name');
    if (!name || name === this.state.activeTab) {
      return;
    }
    this.setState({ activeTab: name });
  },
  render: function () {
    var modal = this.props.modal;
    var dockToBottom = this.state.dockToBottom;
    var activeTab = this.state.activeTab || 'network';
    var showNetworkTab = activeTab == 'network';
    return (
      <div className={'orient-vertical-box fill w-nav-tabs' + (this.props.hide ? ' hide' : '')}>
        {dataCenter.tokenId ? <ul className="nav nav-tabs">
          <li className={'w-nav-normal-tab' + (showNetworkTab ? ' active' : '')} onClick={this.switchTab}>
            <a draggable="false" data-name="network">
              <span data-name="network" className={'glyphicon glyphicon-' + (modal.isTreeView ? 'tree-conifer' : 'globe')} />
              Network
            </a>
          </li>
          <li ref="savedTab" className={'w-nav-normal-tab' + (activeTab === 'savedSessions' ? ' active' : '')} onClick={this.switchTab}>
            <a data-name="savedSessions" draggable="false">
              <span data-name="savedSessions" className="glyphicon glyphicon-saved" />
              Saved Sessions
            </a>
          </li>
          <li className={'w-nav-normal-tab' + (activeTab === 'sharedSessions' ? ' active' : '')} onClick={this.switchTab}>
            <a data-name="sharedSessions" draggable="false">
              <span data-name="sharedSessions" className="glyphicon glyphicon-share" />
              Shared Sessions
            </a>
          </li>
        </ul> : null}
        <Divider
          ref="divider"
          vertical={dockToBottom}
          rightWidth={this.state.rightWidth}
        >
          <div className="fill orient-vertical-box">
            <ReqData modal={modal} hide={!showNetworkTab} />
            <div className={activeTab === 'savedSessions' ? null : 'hide'}>Saved Sessions Content</div>
            <div className={activeTab === 'sharedSessions' ? null : 'hide'}>Shared Sessions Content</div>
          </div>
          <Detail
            dockToBottom={dockToBottom}
            onDockChange={this.onDockChange}
            modal={modal}
            rulesModal={this.props.rulesModal}
          />
        </Divider>
      </div>
    );
  }
});

module.exports = Network;
