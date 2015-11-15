var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function FileWriterTransform(writer) {
	if (!(this instanceof FileWriterTransform)) {
		  return new FileWriterTransform(options);
	  }
	
	Transform.call(this);
	this._writer = writer;
}

util.inherits(FileWriterTransform, Transform);

FileWriterTransform.prototype._transform = function(chunk, encoding, callback) {
	clearTimeout(this._timeout);
	if (chunk) {
		this._writer.write(chunk);
		this._timeout = setTimeout(this._endIfTimeout, 38000);
	} else {
		this._writer.end();
	}
	callback(null, chunk);
};

module.exports = FileWriterTransform;