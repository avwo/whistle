require('./base-css.js');
var React = require('react');
var $ = require('jquery');
var Divider = require('./divider');
var ReqDetail = require('./req-detail');
var ResDetail = require('./res-detail');
var ExpandCollapse = require('./expand-collapse');
var ContextMenu = require('./context-menu');
var util = require('./util');

var contextMenuList = [ { name: 'Copy Key' }, { name: 'Copy Value' } ];

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
  onContextMenu: function(e) {
    var modal = this.props.modal;
    var target = $(e.target).closest('label');
    var keyPath = modal && util.parseJSON(target.attr('data-key-path'));
    if (!Array.isArray(keyPath)) {
      return;
    }
    var isReq = target.closest('.w-detail-request') .length;
    var value = isReq ? util.getJson(modal.req, true, decodeURIComponent) : modal.res && util.getJson(modal.res);
    value = value && value.json;
    if (value) {
      for (var i = keyPath.length - 2; i >= 0; i--) {
        value = value && value[keyPath[i]];
      }
    }
    var ctxMenu = util.getMenuPosition(e, 110, 70);
    ctxMenu.list = contextMenuList;
    ctxMenu.className = 'w-inspectors-ctx-menu';
    contextMenuList[0].copyText = keyPath[0];
    if (value && typeof value === 'object' && !(value instanceof String)) {
      try {
        value = JSON.stringify(value, null, '  ');
      } catch (e) {}
    }
    contextMenuList[1].copyText = value + '';
    this.refs.contextMenu.show(ctxMenu);
    e.preventDefault();
  },
  render: function() {
    var props = this.props;
    var modal = props.modal;
    var url = modal && modal.url;
    this.endTime = modal && (modal.endTime || modal.lost);
    return (
      <div className={'fill orient-vertical-box w-detail-inspectors' + (util.getBoolean(this.props.hide) ? ' hide' : '')}
        onContextMenu={this.onContextMenu}
      >
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
        <ContextMenu ref="contextMenu" />
      </div>
    );
  }
});

module.exports = Inspector;
