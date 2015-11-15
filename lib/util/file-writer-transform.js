var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function FileWriterTransform(writer) {
	if (!(this instanceof FileWriterTransform)) {
		  return new FileWriterTransform(options);
	  }
	var self = this;
	Transform.call(self);
	self._writer = writer;
	self._endIfTimeout = function() {
		writer.end();
		self._endIfTimeout = null;
	};
}

util.inherits(FileWriterTransform, Transform);

FileWriterTransform.prototype._transform = function(chunk, encoding, callback) {
	if (this._endIfTimeout) {
		clearTimeout(this._timeout);
		if (chunk) {
			this._writer.write(chunk);
			this._timeout = setTimeout(this._endIfTimeout, 38000);
		} else {
			this._writer.end();
		}
	}
	
	callback(null, chunk);
};

module.exports = FileWriterTransform;