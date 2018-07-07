var React = require('react');
var ReactDOM = require('react-dom');
var util = require('./util');
var FilterInput = require('./filter-input');
var DropDown = require('./dropdown');

var SEND_PERATORS = [
  {
    value: 0,
    icon: 'arrow-right',
    text: 'Send'
  },
  {
    value: 1,
    icon: 'arrow-right',
    text: 'Pause'
  },
  {
    value: 2,
    icon: 'arrow-right',
    text: 'Ignore'
  }
];
var RECEIVE_PERATORS = [
  {
    value: 0,
    icon: 'arrow-left',
    text: 'Receive'
  },
  {
    value: 1,
    icon: 'arrow-left',
    text: 'Pause'
  },
  {
    value: 2,
    icon: 'arrow-left',
    text: 'Ignore'
  }
];

var FrameList = React.createClass({
  onFilterChange: function(keyword) {
    this.props.modal.search(keyword);
    this.setState({ keyword: keyword.trim() });
  },
  componentWillUpdate: function() {
    this.atBottom = this.shouldScrollToBottom();
  },
  componentDidUpdate: function() {
    if (this.atBottom) {
      this.autoRefresh();
    }
  },
  stopRefresh: function() {
    this.container.scrollTop = this.container.scrollTop - 10;
  },
  autoRefresh: function() {
    this.container.scrollTop = 100000000;
  },
  clear: function() {
    this.props.modal.clear();
    this.setState({});
    if (this.props.onUpdate) {
      this.props.onUpdate();
    }
  },
  onClear: function(e) {
    if ((e.ctrlKey || !e.metaKey) && e.keyCode === 88) {
      this.clear();
    }
  },
  shouldScrollToBottom: function() {
    var con = this.container;
    var ctn =this.content;
    var modal = this.props.modal;
    var atBottom = con.scrollTop + con.offsetHeight + 5 > ctn.offsetHeight;
    if (atBottom) {
      modal.update();
    }
    return atBottom;
  },
  setContainer: function(container) {
    this.container = ReactDOM.findDOMNode(container);
  },
  setContent: function(content) {
    this.content = ReactDOM.findDOMNode(content);
  },
  render: function() {
    var self = this;
    var props = self.props;
    var reqData = props.reqData;
    var onClickFrame = props.onClickFrame;
    var modal = self.props.modal;
    var keyword = this.state && this.state.keyword;
    return (<div className="fill orient-vertical-box w-frames-list">
      <FilterInput onChange={self.onFilterChange} />
      <div className="w-frames-action">
        <a onClick={self.clear} className="w-remove-menu"
          href="javascript:;" draggable="false">
          <span className="glyphicon glyphicon-remove"></span>Clear
        </a>
        <a onClick={self.autoRefresh} onDoubleClick={self.stopRefresh} className="w-remove-menu"
          href="javascript:;" draggable="false">
          <span className="glyphicon glyphicon-play"></span>AutoRefresh
        </a>
        <a onClick={self.replay} className="w-remove-menu"
          href="javascript:;" draggable="false">
          <span className="glyphicon glyphicon-repeat"></span>Replay
        </a>
        <a onClick={self.composer} className="w-remove-menu"
          href="javascript:;" draggable="false">
          <span className="glyphicon glyphicon-edit"></span>Composer
        </a>
        <a onClick={self.abort} className="w-remove-menu"
          href="javascript:;" draggable="false">
          <span className="glyphicon glyphicon-ban-circle"></span>Abort
        </a>
        <DropDown
          onChange={self.onSendTypeChange}
          options={SEND_PERATORS}
        />
        <DropDown
          onChange={self.onReceiveTypeChange}
          options={RECEIVE_PERATORS}
        />
      </div>
      <div
        tabIndex="0"
        onKeyDown={this.onClear}
        style={{background: keyword ? '#ffffe0' : undefined}}
        onScroll={self.shouldScrollToBottom} ref={self.setContainer} className="fill w-frames-list">
        <ul ref={self.setContent}>
          {modal.getList().map(function(item) {
            var statusClass = '';
            if (item.closed || item.err) {
              reqData.closed = item.closed;
              reqData.err = item.err;
              if (item.closed) {
                statusClass = ' w-connection-closed';
              } else {
                statusClass = ' w-connection-error';
              }
            }
            if (item.data == null) {
              item.data = util.getBody(item, true);
              if (item.data.length > 500) {
                item.data = item.data.substring(0, 500) + '...';
              }
            }
            if (!item.title && !item.closed) {
              item.title = 'Date: ' + new Date(parseInt(item.frameId, 10)).toLocaleString()
               + '\nFrom: ' + (item.isClient ? 'Client' : 'Server');
              if (item.opcode) {
                item.title += '\nOpcode: ' + item.opcode;
                item.title += '\nType: ' + (item.opcode == 1 ? 'Text' : 'Binary');
              }
              if (item.compressed) {
                item.title += '\nCompressed: ' + item.compressed;
              }
              if (item.mask) {
                item.title += '\nMask: ' + item.mask;
              }
              var length = item.length;
              if (length >= 0) {
                if (length >= 1024) {
                  length += '(' + Number(length / 1024).toFixed(2) + 'k)';
                }
                item.title += '\nLength: ' + length;
              }
            }
            var icon = 'arrow-left';
            if (item.closed) {
              icon = 'minus-sign';
            } else if (item.isClient) {
              icon = 'arrow-right';
            }
            return (
              <li
                key={item.frameId}
                title={item.title}
                style={{display: item.hide ? 'none' : undefined}}
                onClick={function() {
                  onClickFrame && onClickFrame(item);
                }} className={(item.isClient ? 'w-frames-send' : '')
                  + (item.active ? '  w-frames-selected' : '') + statusClass}>
                <span className={'glyphicon glyphicon-' + icon}></span>
                {item.data}
              </li>
            );
          })}
        </ul>
      </div>
    </div>);
  }
});

module.exports = FrameList;
