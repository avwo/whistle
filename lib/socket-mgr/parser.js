/**
 * 包的格式
 * --------------------------------
 * 1B  |  4B    | length  | 1B
 * 0x2 | length | message | 0x5
 * --------------------------------
 */

// 包头包尾标识符
var Buffer = require('safe-buffer').Buffer;
var noop = require('../util').noop;

var PACKET_START = 0x2;
var PACKET_END = 0x5;
var LENGTH_FIELD_LEN = 4;
var MSG_OFFSET = LENGTH_FIELD_LEN + 1;
var MAX_PACKET_LENGTH = 0xffffffff;

function Decoder(maxPayload) {
  this.maxPayload = maxPayload > 0 ? +maxPayload : 0;
  this.onData = noop;
  this.write = this.write.bind(this);
}
var proto = Decoder.prototype;

proto.write = function(data) {
  if (!Buffer.isBuffer(data)) {
    return;
  }
  if (this._curMsgLen) {
    this._curMsgLen += data.length;
  }
  this.buffer = this.buffer ? Buffer.concat([this.buffer, data]) : data;
  this.expectPacket();
};

proto.expectPacket = function() {
  if (this.parsingHeader) {
    return this.expectHeader();
  }
  this._curMsgLen = 0;
  var start = this.buffer.indexOf(PACKET_START);
  if (start === -1) {
    this.buffer = null;
    return;
  }
  this.buffer = this.buffer.slice(start + 1);
  this.expectHeader();
};

proto.processBuffer = function() {
  var len = this.maxPayload ? this.buffer.length : 0;
  if (len > this.maxPayload) {
    this._curMsgLen = this._curMsgLen || len;
    this.buffer = this.buffer.slice(0, this.maxPayload);
  }
};

proto.expectHeader = function() {
  this.parsingHeader = true;
  if (this.parsingData) {
    return this.expectData();
  }
  if (this.buffer.length < LENGTH_FIELD_LEN) {
    return;
  }
  this.messageLength = this.buffer.readUInt32BE();
  this.buffer = this.buffer.slice(LENGTH_FIELD_LEN);
  this.expectData();
};

proto.expectData = function() {
  this.parsingData = true;
  var len = this._curMsgLen || this.buffer.length;
  if (len < this.messageLength) {
    return this.processBuffer();
  }
  len = this.maxPayload ? Math.min(this.maxPayload, len) : this.messageLength;
  var message = this.buffer.slice(0, len);
  this.buffer = this.buffer.slice(len);
  this.parsingHeader = false;
  this.parsingData = false;
  this._curMsgLen = 0;
  this.onData(message);
  this.expectPacket();
};

var toBuffer = (data) => {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data == null) {
    data = '';
  } else if (typeof data !== 'string') {
    data = JSON.stringify(data);
  }
  return Buffer.from(data);
};

var encode = (data) => {
  data = toBuffer(data);
  var { length } = data;
  if (length > MAX_PACKET_LENGTH) {
    throw new Error(`The message length exceeds ${MAX_PACKET_LENGTH}.`);
  }
  var totalLen = length + LENGTH_FIELD_LEN + 2;
  var result = Buffer.allocUnsafe(totalLen);
  result[0] = PACKET_START;
  result.writeUInt32BE(length, 1);
  if (length) {
    result.fill(data, MSG_OFFSET);
  }
  result[totalLen - 1] = PACKET_END;
  return result;
};


exports.Decoder = Decoder;
exports.encode = encode;
