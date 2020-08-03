var React = require('react');
var ReactDOM = require('react-dom');
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
var message = require('./message');
var storage = require('./storage');

var MAX_FILE_SIZE = 1024 * 1025;
var MAX_LENGTH = 1024 * 64;
var JSON_RE = /^\s*(?:[\{｛][\w\W]+[\}｝]|\[[\w\W]+\])\s*$/;

var FrameComposer = React.createClass({
  getInitialState: function() {
    return {
      isHexText: !!storage.get('showHexTextFrame'),
      isCRLF: !!storage.get('useCRLFrame')
    };
  },
  componentDidMount: function() {
    var self = this;
    self.dataField = ReactDOM.findDOMNode(self.refs.uploadData);
    self.dataForm = ReactDOM.findDOMNode(self.refs.uploadDataForm);
    events.on('composeFrame', function(e, frame) {
      if (frame) {
        var body;
        if (self.state.isHexText) {
          body = util.getHexText(util.getHex(frame));
        } else {
          body = util.getBody(frame, true);
        }
        self.setTextarea(body);
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
    var text = storage.get('composeFrameData');
    this.setTextarea(String(text || ''));
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
      return alert('The file size cannot exceed 1m.');
    }
    var self = this;
    var params = {
      target: self.target,
      type: self.dataType
    };
    util.readFileAsBase64(file, function(base64) {
      params.base64 = base64;
      self.send(params);
      self.dataField.value = '';
    });
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
      if (data.ec !== 0) {
        return message.error('Server busy, try again later.');
      }
      cb && cb();
    });
  },
  onSend: function(e) {
    var value = this.state.text;
    var self = this;
    if (!value || self.sendTimer) {
      return;
    }
    var target = e.target;
    var base64;
    if (this.state.isHexText) {
      base64 = util.getBase64FromHexText(value);
      if (base64 === false) {
        alert('The hex text cannot be converted to binary data.\nPlease check the hex text or switch to plain text.');
        return;
      }
      value = undefined;
    } else if (this.state.isCRLF) {
      value = value.replace(/\r\n|\r|\n/g, '\r\n');
    }
    var params = {
      type: target.nodeName === 'A' ? 'bin' : 'text',
      target: target.getAttribute('data-target') ? 'server' : 'client',
      text: value,
      base64: base64
    };
    self.setState({});
    self.sendTimer = setTimeout(function() {
      self.sendTimer = null;
      self.setState({});
    }, 5000);
    self.send(params, function() {
      clearTimeout(self.sendTimer);
      self.sendTimer = null;
      events.trigger('autoRefreshFrames');
      self.setState({});
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
    clearTimeout(this.timer);
    this.timer = setTimeout(function() {
      storage.set('composeFrameData', text);
    }, 600);
  },
  onTextareaChange: function(e) {
    this.setTextarea(e.target.value);
  },
  preventDefault: function(e) {
    e.preventDefault();
  },
  onTypeChange: function(e) {
    var isHexText = e.target.checked;
    storage.set('showHexTextFrame', isHexText ? 1 : '');
    this.setState({ isHexText: isHexText });
    if (isHexText && util.getBase64FromHexText(this.state.text, true) === false) {
      message.error('The hex text cannot be converted to binary data.');
    }
  },
  onCRLFChange: function(e) {
    var isCRLF = e.target.checked;
    storage.set('useCRLFrame', isCRLF ? 1 : '');
    this.setState({ isCRLF: isCRLF });
  },
  render: function() {
    var data = this.props.data || '';
    util.socketIsClosed(data);
    var state = this.state;
    var isJSON = state.isJSON;
    var text = state.text || '';
    var isHexText = state.isHexText;
    var isCRLF = state.isCRLF;
    var closed = data.closed;
    var isHttps = data.isHttps;
    var leftStyle = isHttps ? {left: 0} : undefined;
    var displayStyle = isHttps ? {display: 'none'} : undefined;
    var tips = closed ? 'The connection is closed' : undefined;
    var disabled = closed || this.sendTimer;
    return (
      <div onDrop={this.onDrop} className={'fill orient-vertical-box w-frames-composer' + (this.props.hide ? ' hide' : '')}>
        <div className="w-frames-composer-action">
          <label className={'w-frames-hex-data' + (isHexText ? ' w-frames-checked' : '')}>
            <input checked={isHexText} onChange={this.onTypeChange} type="checkbox" />HexText
          </label>
          <label className={'w-frames-crlf' + (isHexText ? ' hide' : '')
            + (isCRLF ? ' w-frames-checked' : '')}>
            <input checked={isCRLF} onChangeCapture={this.onCRLFChange} type="checkbox" />\r\n
          </label>
          <div className="btn-group">
            <button disabled={disabled} title={tips} onMouseDown={this.preventDefault} onClick={this.onSend}
              type="button" className="btn btn-default btn-sm">
              <span className="glyphicon glyphicon-arrow-left"></span>
              Send to client
            </button>
            <button disabled={disabled} title={tips} type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul style={leftStyle} className={'dropdown-menu' + (closed ? ' hide' : '')}>
              <li style={displayStyle}><a onClick={this.onSend}>Send binary data</a></li>
              <li><a onClick={this.uploadTextToClient}>{isHttps ? 'Upload to client' : 'Upload text data'}</a></li>
              <li style={displayStyle}><a onClick={this.uploadBinToClient}>Upload binary data</a></li>
            </ul>
          </div>
          <div className="btn-group">
            <button disabled={disabled} title={tips} onMouseDown={this.preventDefault} data-target="server"
              onClick={this.onSend} type="button" className="btn btn-default btn-sm">
              <span className="glyphicon glyphicon-arrow-right"></span>
              Send to server
            </button>
            <button disabled={disabled} title={tips} type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul style={leftStyle} className={'dropdown-menu' + (closed ? ' hide' : '')}>
              <li style={displayStyle}><a data-target="server" onClick={this.onSend}>Send binary data</a></li>
              <li><a onClick={this.uploadTextToServer}>{isHttps ? 'Upload to server' : 'Upload text data'}</a></li>
              <li style={displayStyle}><a onClick={this.uploadBinToServer}>Upload binary data</a></li>
            </ul>
          </div>
          <button disabled={!isJSON} type="button" title="Format JSON" onClick={this.format}
            className="btn btn-default w-format-json-btn">Format</button>
        </div>
        <textarea style={{ fontFamily: isHexText ? 'monospace' : undefined }} maxLength={MAX_LENGTH}
          value={text} onChange={this.onTextareaChange} placeholder={'Input the ' + (isHexText ? 'hex ' : '') + 'text'} className="fill" />
        <form ref="uploadDataForm" method="post" encType="multipart/form-data" style={{display: 'none'}}> 
          <input ref="uploadData" onChange={this.onFormChange} type="file" name="uploadData" />
        </form>
      </div>
    );
  }
});

module.exports = FrameComposer;