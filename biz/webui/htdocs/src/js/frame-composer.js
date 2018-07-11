var React = require('react');
var ReactDOM = require('react-dom');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
var fromByteArray  = require('base64-js').fromByteArray ;

var MAX_FILE_SIZE = 1024 * 1025;
var MAX_LENGTH = 1024 * 64;
var JSON_RE = /^\s*(?:[\{｛][\w\W]+[\}｝]|\[[\w\W]+\])\s*$/;

var FrameComposer = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    var self = this;
    self.dataField = ReactDOM.findDOMNode(self.refs.uploadData);
    self.dataForm = ReactDOM.findDOMNode(self.refs.uploadDataForm);
    events.on('composeFrame', function(e, frame) {
      if (frame) {
        self.setTextarea(util.getBody(frame, true));
      }
    });
    events.on('replayFrame', function(e, frame) {
      if (!frame) {
        return;
      }
      self.send({
        target: frame.isClient ? 'server' : 'client',
        type: frame.opcode == 1 ? 'text' : 'bin',
        base64: frame.base64
      }, function() {
        events.trigger('autoRefreshFrames');
      });
    });
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  uploadTextToServer: function() {
    this.target = 'server';
    this.dataType = 'text';
    this.dataField.click();
  },
  uploadBinToServer: function() {
    this.target = 'server';
    this.dataType = 'bin';
    this.dataField.click();
  },
  uploadTextToClient: function() {
    this.target = 'client';
    this.dataType = 'text';
    this.dataField.click();
  },
  uploadBinToClient: function() {
    this.target = 'client';
    this.dataType = 'bin';
    this.dataField.click();
  },
  onFormChange: function() {
    this.uploadForm(new FormData(this.dataForm));
    this.dataField.value = '';
  },
  uploadForm: function(form) {
    var file = form.get('uploadData');
    if (file.size > MAX_FILE_SIZE) {
      return alert('The file size can not exceed 1m.');
    }
    var reader = new FileReader();
    reader.readAsArrayBuffer(file);
    var self = this;
    var params = {
      target: self.target,
      type: self.dataType
    };
    reader.onload = function () {
      params.base64 = fromByteArray(new window.Uint8Array(reader.result));
      self.send(params);
      self.dataField.value = '';
    };
  },
  send: function(params, cb) {
    var data = this.props.data;
    if (!data) {
      return;
    }
    params.reqId = data.id;
    dataCenter.socket.send(params, function(data, xhr) {
      if (!data) {
        return util.showSystemError(xhr);
      }
      cb && cb();
    });
  },
  onSend: function(e) {
    var value = this.state.text;
    if (!value) {
      return;
    }
    var self = this;
    var target = e.target;
    var params = {
      type: target.nodeName === 'A' ? 'bin' : 'text',
      target: target.getAttribute('data-target') ? 'server' : 'client',
      text: value.replace(/\r\n|\r|\n/g, '\r\n')
    };
    self.send(params, function() {
      self.setTextarea('');
    });
  },
  format: function() {
    var data = util.parseRawJson(this.state.text);
    if (data) {
      this.setState({
        isJSON: true,
        text: JSON.stringify(data, null, '  ')
      });
    }
  },
  setTextarea: function(text) {
    this.setState({
      text: text,
      isJSON: JSON_RE.test(text)
    });
  },
  onTextareaChange: function(e) {
    this.setTextarea(e.target.value);
  },
  preventDefault: function(e) {
    e.preventDefault();
  },
  render: function() {
    var data = this.props.data || '';
    var isJSON = this.state.isJSON;
    var text = this.state.text;
    var closed = data.closed;
    var isHttps = data.isHttps;
    var leftStyle = isHttps ? {left: 0} : undefined;
    var displayStyle = isHttps ? {display: 'none'} : undefined;
    var tips = data.closed ? 'The connection is closed' : undefined;
    return (
      <div onDrop={this.onDrop} className={'fill orient-vertical-box w-frames-composer' + (this.props.hide ? ' hide' : '')}>
        <div className="w-frames-composer-action">
          <div className="btn-group">
            <button disabled={closed} title={tips} onMouseDown={this.preventDefault} data-target="server"
              onClick={this.onSend} type="button" className="btn btn-primary btn-sm">Send to server</button>
            <button disabled={closed} title={tips} type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul style={leftStyle} className={'dropdown-menu' + (closed ? ' hide' : '')}>
              <li style={displayStyle}><a data-target="server" onClick={this.onSend} href="javascript:;">Send binary data</a></li>
              <li><a onClick={this.uploadTextToServer} href="javascript:;">{isHttps ? 'Upload to server' : 'Upload text data'}</a></li>
              <li style={displayStyle}><a onClick={this.uploadBinToServer} href="javascript:;">Upload binary data</a></li>
            </ul>
          </div>
          <div className="btn-group">
            <button disabled={closed} title={tips} onMouseDown={this.preventDefault} onClick={this.onSend}
              type="button" className="btn btn-default btn-sm">Send to client</button>
            <button disabled={closed} title={tips} type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul style={leftStyle} className={'dropdown-menu' + (closed ? ' hide' : '')}>
              <li style={displayStyle}><a onClick={this.onSend} href="javascript:;">Send binary data</a></li>
              <li><a onClick={this.uploadTextToClient} href="javascript:;">{isHttps ? 'Upload to client' : 'Upload text data'}</a></li>
              <li style={displayStyle}><a onClick={this.uploadBinToClient} href="javascript:;">Upload binary data</a></li>
            </ul>
          </div>
          <button disabled={!isJSON} type="button" title="Format JSON" onClick={this.format}
            className="btn btn-default w-format-json-btn">Format</button>
        </div>
        <textarea maxLength={MAX_LENGTH} value={text} onChange={this.onTextareaChange} placeholder={'Input the text'} className="fill" />
        <form ref="uploadDataForm" method="post" encType="multipart/form-data" style={{display: 'none'}}> 
          <input ref="uploadData" onChange={this.onFormChange} type="file" name="uploadData" />
        </form>
      </div>
    );
  }
});

module.exports = FrameComposer;