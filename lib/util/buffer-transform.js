var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function toBuffer(data) {
	return data ? (data instanceof Buffer ? data : new Buffer(data + '')) : null;
}

function BufferTransform(data) {
	if (!(this instanceof BufferTransform)) {
		  return new BufferTransform(data);
	  }
	
	Transform.call(this);
	if (data.body) {
		var body = [];
		data.top && body.push(toBuffer(data.top));
		body.push(body);
		data.bottom && body.push(toBuffer(data.bottom));
		data.body = Buffer.concat(toBuffer(body));
	} else {
		this._top = toBuffer(data.top);
		this._bottom = toBuffer(data.bottom);
	}
}

util.inherits(BufferTransform, Transform);

BufferTransform.prototype._transform = function(chunk, encoding, callback) {
	if (this._ended || this._body) {
		callback(null, this._body);
		this._body = null;
		this._ended = true;
	} else if (this._top) {
		callback(null, chunk ? Buffer.concat([chunk, this._top]) : this._top);
		this._top = null;
	} else if (chunk == null && this._bottom) {
		callback(null, this._bottom);
		this._bottom = null;
	}
};

module.exports = BufferTransform;