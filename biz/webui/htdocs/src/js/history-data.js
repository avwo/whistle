require('./base-css.js');
require('../css/composer.css');
var React = require('react');
var ReactDOM = require('react-dom');
var Divider = require('./divider');

var HistoryData = React.createClass({
  getInitialState: function() {
    return {};
  },
  shouldComponentUpdate: function (nextProps) {
    return this.props.show || nextProps.show !== this.props.show;
  },
  getItem: function () {
    var list = this.props.data;
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (item.selected) {
        return item;
      }
    }
  },
  scrollToTop: function() {
    ReactDOM.findDOMNode(this.refs.list).scrollTop = 0;
  },
  onEdit: function () {
    this.props.onEdit(this.getItem());
  },
  onReplay: function () {
    this.props.onReplay(this.getItem());
    this.scrollToTop();
  },
  onReplayTimes: function() {
    this.props.onReplay(this.getItem(), true);
    this.scrollToTop();
  },
  handleClick: function(item) {
    this.props.data.forEach(function(item) {
      item.selected = false;
    });
    item.selected = true;
    this.setState({});
  },
  render: function () {
    var self = this;
    var props = self.props;
    var show = props.show;
    var data = props.data || [];
    var groupList = data._groupList || [];
    var selectedItem;
    return (
      <div ref="historyDialog" className={'w-layer box w-composer-history-data' + (show ? '' : ' hide')}>
        {data.length ?
        <Divider leftWidth="170">
          <div ref="list" className="w-composer-history-list">
            {groupList.map(function(item) {
              if (item.title) {
                return <div className="w-history-title" title={item.title}>{item.title}</div>;
              }
              if (item.selected) {
                selectedItem = item;
              }
              return (
                <div className={'w-history-item' + (item.selected ? ' w-selected' : '')}
                  title={item.url} onClick={() => self.handleClick(item)}>
                  {item.path}
                  <p>
                    <i className="w-req-protocol-tag">{item.protocol}</i>
                    <i className="w-req-method-tag">{item.method}</i>
                    {item.body ? <i className="w-req-type-tag">Body</i> : null}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="fill w-composer-history-ctn">
            {selectedItem ? <div className="w-composer-history-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={this.onEdit}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={this.onReplay}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={this.onReplayTimes}
                >
                  Replay Times
                </button>
                <span onClick={props.onClose} aria-hidden="true" className="w-close">&times;</span>
              </div> : null}
            {selectedItem ? <pre>{selectedItem.raw}</pre> : null}
          </div>
        </Divider> : <div className="w-empty-data">
            Empty
          </div>}
      </div>
    );
  }
});

module.exports = HistoryData;
