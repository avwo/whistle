var React = require('react');
var ReactDOM = require('react-dom');
var dataCenter = require('./data-center');
var util = require('./util');

var MAX_FILE_SIZE = 1024 * 1025;
var MAX_LENGTH = 1024 * 64;

var FrameComposer = React.createClass({
  getInitialState: function() {
    return {};
  },
  componentDidMount: function() {
    this.dataField = ReactDOM.findDOMNode(this.refs.uploadData);
    this.dataForm = ReactDOM.findDOMNode(this.refs.uploadDataForm);
  },
  shouldComponentUpdate: function(nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  selectFile: function() {
    this.dataField.click();
  },
  onFormChange: function() {
    this.uploadForm(new FormData(this.dataForm));
    this.dataField.value = '';
  },
  uploadForm: function(form) {
    if (form.get('uploadData').size > MAX_FILE_SIZE) {
      return alert('The file size can not exceed 1m.');
    }
    dataCenter.socket.upload(form);
  },
  onSend: function(e) {
    var value = this.state.data;
    if (!value) {
      return;
    }
    var self = this;
    dataCenter.socket.send({
      cId: this.props.cId,
      type: e.target.nodeName === 'A' ? 'bin' : 'text/plain',
      data: value.replace(/\r\n|\r|\n/g, '\r\n')
    }, function(data) {
      self.setState({ data: '' });
    });
  },
  onTextareaChange: function(e) {
    this.setState({
      data: e.target.value
    });
  },
  preventDefault: function(e) {
    e.preventDefault();
  },
  render: function() {
    var data = this.props.data;
    if (!data) {
      return null;
    }
    var text = this.state.data;
    var closed = data.closed;
    var disabled = closed || data.hasPendingData;
    var tips = data.closed ? 'The connection is closed' : undefined;
    return (
      <div onDrop={this.onDrop} className={'fill orient-vertical-box w-frames-composer' + (this.props.hide ? ' hide' : '')}>
        <div className="w-frames-composer-action">
          <div className="btn-group">
            <button disabled={disabled} title={tips} onMouseDown={this.preventDefault} onClick={this.onSend}
              type="button" className="btn btn-primary btn-sm">Send to client</button>
            <button disabled={disabled} title={tips} type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul className={'dropdown-menu' + (disabled ? ' hide' : '')}>
              <li><a onClick={this.onSend} href="javascript:;">Send binary data</a></li>
              <li><a onClick={this.selectFile} href="javascript:;">Upload text data</a></li>
              <li><a onClick={this.selectFile} href="javascript:;">Upload binary data</a></li>
            </ul>
          </div>
          <div className="btn-group">
            <button disabled={disabled} title={tips} onMouseDown={this.preventDefault}
              onClick={this.onSend} type="button" className="btn btn-primary btn-sm">Send to server</button>
            <button disabled={disabled} title={tips} type="button" className="btn btn-primary dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span className="caret"></span>
            </button>
            <ul className={'dropdown-menu' + (disabled ? ' hide' : '')}>
              <li><a onClick={this.onSend} href="javascript:;">Send binary data</a></li>
              <li><a onClick={this.selectFile} href="javascript:;">Upload text data</a></li>
              <li><a onClick={this.selectFile} href="javascript:;">Upload binary data</a></li>
            </ul>
          </div>
          <button type="button" title="Format JSON" className="btn btn-primary w-format-json-btn">Format</button>
        </div>
        <textarea maxLength={MAX_LENGTH} value={text} onChange={this.onTextareaChange} placeholder={'Input the text'} className="fill"></textarea>
        <form ref="uploadDataForm" method="post" encType="multipart/form-data" style={{display: 'none'}}> 
          <input name="reqId" type="hidden" />
          <input name="dataType" type="hidden" />
          <input name="sendTo" type="hidden" />
          <input ref="uploadData" onChange={this.onFormChange} type="file" name="uploadData" />
        </form>
      </div>
    );
  }
});

module.exports = FrameComposer;