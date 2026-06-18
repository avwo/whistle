var React = require('react');
var findDOMNode = require('react-dom').findDOMNode;
var dataCenter = require('./data-center');
var util = require('./util');
var message = require('./message');
var storage = require('./storage');
var win = require('./win');
var Icon = require('./icon');

var MAX_FILE_SIZE = 1024 * 1025;
var MAX_LENGTH = 1024 * 64;

var FrameComposer = React.createClass({
  getInitialState: function () {
    return {
      isHexText: !!storage.get('showHexTextFrame'),
      isCRLF: !!storage.get('useCRLFrame')
    };
  },
  componentDidMount: function () {
    var self = this;
    var framesCtx = self.props.framesCtx;
    self.dataField = findDOMNode(self.refs.uploadData);
    self.dataForm = findDOMNode(self.refs.uploadDataForm);
    framesCtx.on('composeFrame', function (e, frame) {
      if (frame) {
        var body;
        if (self.state.isHexText) {
          body = util.getHexText(util.getHex(frame));
        } else {
          body = util.getBody(frame, true);
        }
        self.setTextarea(body);
        setTimeout(function() {
          findDOMNode(self.refs.textarea).focus();
        }, 60);
      }
    });
    framesCtx.on('replayFrame', function (e, frame) {
      if (!frame) {
        return;
      }
      framesCtx.trigger('enableRecordFrame');
      self.send(
        {
          target: frame.isClient ? 'server' : 'client',
          type: frame.opcode == 1 ? 'text' : 'bin',
          base64: frame.base64
        },
        function () {
          framesCtx.trigger('autoRefreshFrames');
        }
      );
    });
    var text = storage.get('composeFrameData');
    self.setTextarea(String(text || ''));
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
  uploadTextToServer: function () {
    var self = this;
    self.target = 'server';
    self.dataType = 'text';
    self.dataField.click();
  },
  uploadBinToServer: function () {
    var self = this;
    self.target = 'server';
    self.dataType = 'bin';
    self.dataField.click();
  },
  uploadTextToClient: function () {
    var self = this;
    self.target = 'client';
    self.dataType = 'text';
    self.dataField.click();
  },
  uploadBinToClient: function () {
    var self = this;
    self.target = 'client';
    self.dataType = 'bin';
    self.dataField.click();
  },
  onFormChange: function () {
    var self = this;
    self.uploadForm(new FormData(self.dataForm));
    self.dataField.value = '';
  },
  uploadForm: function (form) {
    var file = form.get('uploadData');
    if (file.size > MAX_FILE_SIZE) {
      return win.alert('Maximum file size: 1MB');
    }
    var self = this;
    var params = {
      target: self.target,
      type: self.dataType
    };
    util.readFileAsBase64(file, function (base64) {
      params.base64 = base64;
      self.send(params);
      self.dataField.value = '';
    });
  },
  send: function (params, cb) {
    var data = this.props.data;
    if (!data) {
      return;
    }
    params.reqId = data.id;
    this.props.framesCtx.trigger('enableRecordFrame');
    dataCenter.socket.send(params, function (data, xhr) {
      if (!data) {
        return util.showSysErr(xhr);
      }
      if (data.ec !== 0) {
        return message.error('Server temporarily unavailable. Please try again shortly');
      }
      cb && cb();
    });
  },
  onSend: function (e) {
    var self = this;
    var state = self.state;
    var value = state.text;
    if (!value || self.sendTimer) {
      return;
    }
    var target = e.target;
    var base64;
    if (state.isHexText) {
      base64 = util.getBase64FromHexText(value);
      value = undefined;
    } else if (state.isCRLF) {
      value = value.replace(/\r\n|\r|\n/g, '\r\n');
    }
    var params = {
      type: target.nodeName === 'A' ? 'bin' : 'text',
      target: target.getAttribute('data-target') ? 'server' : 'client',
      text: value,
      base64: base64
    };
    self.setState({});
    self.sendTimer = setTimeout(function () {
      self.sendTimer = null;
      self.setState({});
    }, 5000);
    self.send(params, function () {
      clearTimeout(self.sendTimer);
      self.sendTimer = null;
      self.props.framesCtx.trigger('autoRefreshFrames');
      self.setState({});
    });
  },
  format: function () {
    var data = util.parseRawJson(this.state.text);
    if (data) {
      this.setState({
        text: JSON.stringify(data, null, '  ')
      });
    }
  },
  onForamt: function (e) {
    util.handleFormat(e, this.format);
    util.handleTab(e);
  },
  setTextarea: function (text) {
    var self = this;
    self.setState({ text: text });
    clearTimeout(self.timer);
    self.timer = setTimeout(function () {
      storage.set('composeFrameData', text);
    }, 600);
  },
  onTextareaChange: function (e) {
    this.setTextarea(e.target.value);
  },
  preventDefault: function (e) {
    e.preventDefault();
  },
  onTypeChange: function (e) {
    var isHexText = e.target.checked;
    storage.set('showHexTextFrame', isHexText ? 1 : '');
    this.setState({ isHexText: isHexText });
  },
  onCRLFChange: function (e) {
    var isCRLF = e.target.checked;
    storage.set('useCRLFrame', isCRLF ? 1 : '');
    this.setState({ isCRLF: isCRLF });
  },
  render: function () {
    var self = this;
    var data = self.props.data || '';
    util.socketIsClosed(data);
    var state = self.state;
    var text = state.text || '';
    var isHexText = state.isHexText;
    var isCRLF = state.isCRLF;
    var closed = data.closed;
    var isHttps = data.isHttps;
    var leftStyle = isHttps ? { left: 0 } : undefined;
    var displayStyle = util.getHideStyle(isHttps);
    var tips = closed ? 'The connection is closed' : undefined;
    var disabled = closed || self.sendTimer;
    return (
      <div
        onDrop={self.onDrop}
        className={
          'fill v-box w-frames-com' +
          (self.props.hide ? ' hide' : '')
        }
      >
        <div className="w-frames-com-action">
          <label
            className={
              'w-frames-hex-data' + (isHexText ? ' w-frames-checked' : '')
            }
          >
            <input
              checked={isHexText}
              onChange={self.onTypeChange}
              type="checkbox"
            />
            HexText
          </label>
          <label
            className={
              'w-frames-crlf' +
              (isHexText ? ' hide' : '') +
              (isCRLF ? ' w-frames-checked' : '')
            }
          >
            <input
              checked={isCRLF}
              onChangeCapture={self.onCRLFChange}
              type="checkbox"
            />
            \r\n
          </label>
          <div className="btn-group">
            <button
              disabled={disabled}
              title={tips}
              onMouseDown={self.preventDefault}
              onClick={self.onSend}
              type="button"
              className="btn btn-default btn-sm"
            >
              <Icon name="arrow-left" />
              Send To Client
            </button>
            <button
              disabled={disabled}
              title={tips}
              type="button"
              className="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <span className="caret"></span>
            </button>
            <ul
              style={leftStyle}
              className={'dropdown-menu' + (closed ? ' hide' : '')}
            >
              <li style={displayStyle}>
                <a onClick={self.onSend}>Send Binary Data</a>
              </li>
              <li>
                <a onClick={self.uploadTextToClient}>
                  {isHttps ? 'Upload ' : 'Upload Text Data'}
                </a>
              </li>
              <li style={displayStyle}>
                <a onClick={self.uploadBinToClient}>Upload Binary Data</a>
              </li>
            </ul>
          </div>
          <div className="btn-group">
            <button
              disabled={disabled}
              title={tips}
              onMouseDown={self.preventDefault}
              data-target="server"
              onClick={self.onSend}
              type="button"
              className="btn btn-default btn-sm"
            >
              <Icon name="arrow-right" />
              Send To Server
            </button>
            <button
              disabled={disabled}
              title={tips}
              type="button"
              className="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >
              <span className="caret"></span>
            </button>
            <ul
              style={leftStyle}
              className={'dropdown-menu' + (closed ? ' hide' : '')}
            >
              <li style={displayStyle}>
                <a data-target="server" onClick={self.onSend}>
                  Send Binary Data
                </a>
              </li>
              <li>
                <a onClick={self.uploadTextToServer}>
                  {isHttps ? 'Upload ' : 'Upload Text Data'}
                </a>
              </li>
              <li style={displayStyle}>
                <a onClick={self.uploadBinToServer}>Upload Binary Data</a>
              </li>
            </ul>
          </div>
          <button
            type="button"
            title="Format"
            onClick={self.format}
            className="btn btn-default w-format-json-btn"
          >
            Format
          </button>
        </div>
        <textarea
          ref="textarea"
          style={{ fontFamily: isHexText ? 'monospace' : undefined }}
          maxLength={MAX_LENGTH}
          value={text}
          onKeyDown={self.onForamt}
          onChange={self.onTextareaChange}
          placeholder={'Enter ' + (isHexText ? 'hex ' : '') + 'text'}
          className="fill"
        />
        <form
          ref="uploadDataForm"
          method="post"
          encType="multipart/form-data"
          style={util.HIDE_STYLE}
        >
          <input
            ref="uploadData"
            onChange={self.onFormChange}
            type="file"
            name="uploadData"
          />
        </form>
      </div>
    );
  }
});

module.exports = FrameComposer;
