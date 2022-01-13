require('./base-css.js');
var React = require('react');
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');
var Inspector = require('./inspector');
var Frames = require('./frames');
var LazyInit = require('./lazy-init');

var Inspectors = React.createClass({
  getInitialState: function() {
    return { activeName: 'Request' };
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  showTab: function(name) {
    if (this.state.activeName !== name) {
      this.setState({ activeName: name });
    }
  },
  isActive: function(name) {
    return this.state.activeName === name;
  },
  getStyle: function(name) {
    return 'btn btn-default' + (this.isActive(name) ? ' w-spec-active' : '');
  },
  render: function() {
    var self = this;
    var props = self.props;
    var modal = props.modal;
    var url = modal && modal.url;
    var hideFrames = !self.isActive('Frames');
  
    return (
      <div className={'fill orient-vertical-box w-detail-inspectors' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <div className="box w-detail-inspectors-url" title={url}>
          <label>Url</label>
          <div className="fill"><ExpandCollapse text={url} /></div>
        </div>
        <div className="box w-detail-inspectors-title w-detail-inspectors-tabs">
          <button type="button" onClick={function() {
            self.showTab('Request');
          }} className={self.getStyle('Request')}>
            <span className="glyphicon glyphicon-arrow-right"></span>Request
          </button>
          <button type="button" onClick={function() {
            self.showTab('Frames');
          }} className={self.getStyle('Frames')}>
            <span className="glyphicon glyphicon-menu-hamburger"></span>Frames
          </button>
          <div className="fill w-custom-tabs hide">

          </div>
        </div>
        <Inspector hide={!self.isActive('Request')} modal={modal} />
        <LazyInit inited={!hideFrames}>
          <Frames hide={hideFrames} data={modal} frames={props.frames} />
        </LazyInit>
        <div className="fill orient-vertical-box hide">

        </div>
      </div>
    );
  }
});

module.exports = Inspectors;
