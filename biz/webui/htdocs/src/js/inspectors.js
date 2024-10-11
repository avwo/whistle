require('./base-css.js');
var React = require('react');
var util = require('./util');
var Inspector = require('./inspector');
var Frames = require('./frames');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var events = require('./events');
var TabMgr = require('./tab-mgr');
var ContextMenu = require('./context-menu');
var Properties = require('./properties');

var Inspectors = React.createClass({
  getInitialState: function () {
    return { activeName: 'Request', urlModal: { Url: '' } };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidMount: function () {
    var self = this;
    events.on('tabsChange', function () {
      self.setState({});
    });
  },
  showTab: function (name) {
    if (this.state.activeName !== name) {
      this.setState({ activeName: name });
    }
  },
  isActive: function (name) {
    return this.state.activeName === name;
  },
  getStyle: function (name) {
    return 'btn btn-default' + (this.isActive(name) ? ' w-spec-active' : '');
  },
  render: function () {
    var self = this;
    var props = self.props;
    var modal = props.modal;
    var urlModal = self.state.urlModal;
    var hideFrames = !self.isActive('Frames');
    var hide = util.getBoolean(props.hide);
    var tabs = dataCenter.getTabs();
    var active = this.state.activeName;
    urlModal.Url = modal && modal.url;

    return (
      <div
        className={
          'fill orient-vertical-box w-detail-inspectors' + (hide ? ' hide' : '')
        }
      >
        <Properties className="w-detail-inspectors-url" modal={urlModal} />
        <div className="box w-detail-inspectors-title w-detail-inspectors-tabs">
          <button
            type="button"
            onClick={function () {
              self.showTab('Request');
            }}
            className={self.getStyle('Request')}
          >
            <span className="glyphicon glyphicon-arrow-right"></span>Request
          </button>
          <button
            type="button"
            onClick={function () {
              self.showTab('Frames');
            }}
            className={self.getStyle('Frames')}
          >
            <span className="glyphicon glyphicon-menu-hamburger"></span>Frames
          </button>
          <div className="fill w-custom-tabs">
            {tabs.map(function (tab) {
              var pluginName = tab.plugin;
              return (
                <button
                  key={pluginName}
                  onClick={function () {
                    self.showTab(pluginName);
                  }}
                  className={self.getStyle(pluginName)}
                  title={pluginName}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
        <Inspector hide={!self.isActive('Request')} modal={modal} />
        <LazyInit inited={!hideFrames}>
          <Frames hide={hideFrames} data={modal} frames={props.frames} />
        </LazyInit>
        <TabMgr
          active={active}
          hide={hide}
          tabs={tabs}
          className="w-custom-tab-panel"
        />
        <ContextMenu ref="contextMenu" />
      </div>
    );
  }
});

module.exports = Inspectors;
