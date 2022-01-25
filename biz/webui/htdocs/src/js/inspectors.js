require('./base-css.js');
var React = require('react');
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var Inspector = require('./inspector');
var Frames = require('./frames');
var LazyInit = require('./lazy-init');
var dataCenter = require('./data-center');
var events = require('./events');
var TabMgr = require('./tab-mgr');

var Inspectors = React.createClass({
  getInitialState: function () {
    return { activeName: 'Request' };
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
    var url = modal && modal.url;
    var hideFrames = !self.isActive('Frames');
    var hide = util.getBoolean(props.hide);
    var tabs = dataCenter.getTabs();
    var active = this.state.activeName;

    return (
      <div
        className={
          'fill orient-vertical-box w-detail-inspectors' + (hide ? ' hide' : '')
        }
      >
        <div className="box w-detail-inspectors-url" title={url}>
          <label>Url</label>
          <div className="fill">
            <ExpandCollapse text={url} />
          </div>
        </div>
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
      </div>
    );
  }
});

module.exports = Inspectors;
