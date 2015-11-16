var Transform = require('pipestream').Transform;
var util = require('util');
var iconv = require('iconv-lite');

function FileWriterTransform(writer, source, isReq, isRaw) {
	if (!(this instanceof FileWriterTransform)) {
		  return new FileWriterTransform(options);
	  }
	var self = this;
	Transform.call(self);
	self._writer = writer;
	source.on('error', function() {
		writer.end();
	});
}

util.inherits(FileWriterTransform, Transform);

FileWriterTransform.prototype._transform = function(chunk, encoding, callback) {
	if (chunk) {
		this._writer.write(chunk);
	} else {
		this._writer.end();
	}
	
	callback(null, chunk);
};

module.exports = FileWriterTransform;