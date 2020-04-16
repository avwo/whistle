require('./base-css.js');
var React = require('react');
var Divider = require('./divider');
var ReqDetail = require('./req-detail');
var ResDetail = require('./res-detail');
var ExpandCollapse = require('./expand-collapse');
var util = require('./util');

var Inspector = React.createClass({
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    if (hide != util.getBoolean(nextProps.hide)) {
      return true;
    }
    if (hide) {
      return false;
    }
    var modal = this.props.modal;
    var newModal = nextProps.modal;
    if (!modal || modal !== newModal) {
      return true;
    }
    
    return !this.endTime;
  },
  render: function() {
    var props = this.props;
    var modal = props.modal;
    var url = modal && modal.url;
    this.endTime = modal && (modal.endTime || modal.lost);
    return (
      <div className={'fill orient-vertical-box w-detail-inspectors' + (util.getBoolean(this.props.hide) ? ' hide' : '')}>
        <div className="box w-detail-inspectors-url" title={url}>
          <label>Url</label>
          <div className="fill"><ExpandCollapse text={url} /></div>
        </div>
        <Divider vertical="true">
          <div className="fill orient-vertical-box">
            <div className="w-detail-inspectors-title">
              <span className="glyphicon glyphicon-arrow-right"></span>Request
            </div>
            <ReqDetail modal={modal} />
          </div>
          <div className="fill orient-vertical-box">
            <div className="w-detail-inspectors-title">
            <span className="glyphicon glyphicon-arrow-left"></span>Response
            </div>
            <ResDetail modal={modal} />
          </div>
        </Divider>
      </div>
    );
  }
});

module.exports = Inspector;
