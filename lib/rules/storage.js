var fs  = require('fs');
var fse = require('fs-extra');
var path = require('path');
var RETRY_INTERVAL = 16000;

function readFileSafe(file) {
	try {
		file = fs.readFileSync(file, {encoding: 'utf8'});
	} catch(e) {
		file = null;
	}
	
	return file || '';
}

function readJsonSafe(file) {
	try {
		file = fse.readJsonSync(file);
	} catch(e) {
		file = null;
	}
	
	return file || {};
}

function noop() {}

function Storage(dir) {
	var self = this;
	if (!(self instanceof Storage)) {
		return new Storage(dir);
	}
	
	self._dir = dir;
	fse.ensureDirSync(dir);
	
	self._files = path.join(dir, 'files');
	self._meta = path.join(dir, 'meta');
	self._properties = path.join(dir, 'properties');
	fse.ensureDirSync(self._files);
	fse.ensureFileSync(self._meta);
	fse.ensureFileSync(self._properties);
	
	var maxIndex = -1;
	var files = {};
	var meta = readJsonSafe(self._meta);
	var marks = meta.marks || [];
	fs.readdirSync(self._files)
			.forEach(function(file) {
				var name = file.split('.');
				if (name.length != 2 || !/^\d+$/.test(name[0])) {
					return;
				}
				var index = parseInt(name[0], 10);
				var filename = decodeURIComponent(name[1]);
				if (index > maxIndex) {
					maxIndex = index;
				}
				files[filename] = {
						index: index,
						name: filename,
						mark: marks.indexOf(filename) == -1 ? false : true,
						data: readFileSafe(path.join(dir, file))
				};
			});
	
	self._cache = {
			maxIndex: maxIndex,
			files: files,
			meta: meta,
			properties: readJsonSafe(self._properties)
	};
	
}

var proto = Storage.prototype;

proto._writeMeta = function _writeMeta() {
	var self = this;
	if (self._writeMetaPending) {
		self._writeMetaWaiting = true;
		return;
	}
	clearTimeout(self._writeMetaTimeout);
	self._writeMetaPending = true;
	fse.outputJson(self._meta, self._cache.meta, function(err) {
		self._writeMetaPending = false;
		if (self._writeMetaWaiting) {
			self._writeMetaWaiting = false;
			self._writeMeta();
		} else if (err) {
			self._writeMetaTimeout = setTimeout(self._writeMeta.bind(self), RETRY_INTERVAL);
		}
	});
};

proto._writeProperties = function _writeProperties() {
	var self = this;
	if (self._writePropertiesPending) {
		self._writePropertiesWaiting = true;
		return;
	}
	clearTimeout(self._writePropertiesTimeout);
	self._writePropertiesPending = true;
	fse.outputJson(self._properties, self._cache.properties, function(err) {
		self._writePropertiesPending = false;
		if (self._writePropertiesWaiting) {
			self._writePropertiesWaiting = false;
			self._writeProperties();
		} else if (err) {
			self._writePropertiesTimeout = setTimeout(self._writeProperties.bind(self), RETRY_INTERVAL);
		}
	});
};

proto._writeFile = function _writeFile(file) {
	var self = this;
	if (!(file = self._cache.files[file])) {
		return;
	}
	if (file._pending) {
		file._waiting = true;
		return;
	}
	clearTimeout(file._timeout);
	file._pending = true;
	fs.writeFile(self._getFilePath(file), file.data, function(err) {
		file._pending = false;
		if (file._waiting) {
			file._waiting = false;
			self._writeFile(file.name);
		} else if (err) {
			file._timeout = setTimeout(function() {
				self._writeFile(file.name);
			}, RETRY_INTERVAL);
		}
	});
};

proto._getFilePath = function _getFilePath(file) {
	file = typeof file == 'string' ? this._cache.files[file] : file;
	return file && path.join(this._files, file.index + '.' + encodeURIComponent(file.name));
};

proto.count = function count() {
	return Object.keys(this._cache.files).length;
};

proto.isMarked = function isMarked(file) {
	if (!file) {
		return;
	}
	
	file = this._cache.file[file];
	return !!(file && file.mark);
};

proto.markFile = function markFile(file) {
	if (!file) {
		return;
	}
	
	var self = this;
	var cache = self._cache;
	file = cache.files[file];
	if (!file) {
		return false;
	}
	file.mark = true;
	var marks = cache.meta.marks = cache.meta.marks || [];
	if (marks.indexOf(file.name) == -1) {
		marks.push(file.name);
		self._writeMeta();
	}
	return true;
};

proto.unmarkFile = function unmarkFile(file) {
	if (!file) {
		return;
	}
	var self = this;
	var marks = self._cache.meta.marks;
	var index = marks && marks.indexOf(file);
	if (index > -1) {
		marks.splice(index, 1);
		self._writeMeta();
	}
};

proto.getMarkFileList = function getMarkFileList() {
	
	return this._cache.meta.marks || [];
};

proto.existsFile = function existsFile(file) {
	
	return this._cache.files[file];
};

proto.getFileList = function getFileList() {
	var cache = this._cache;
	var list = [];
	Object.keys(cache.files)
				.forEach(function(file) {
					list.push(cache.files[file]);
				});
	list.sort(function(prev, next) {
		return prev.index > next.index ? 1 : -1;
	});
	return list;
};

proto.writeFile = function writeFile(file, data) {
	if (!file) {
		return;
	}
	
	var self = this;
	var cache = self._cache;
	var fileData = cache.files[file];
	if (!fileData) {
		fileData = cache.files[file] = {
				index: ++cache.maxIndex,
				name: file
		};
	}
	fileData.data = data == null ? '' : data;
	self._writeFile(file);
	return fileData;
};

proto.readFile = function(file) {
	return file && this._cache.files[file];
};

proto.removeFile = function removeFile(file) {
	var files = this._cache.files;
	file = file && files[file];
	if (!file) {
		return;
	}
	
	delete files[file.name];
	fs.unlink(this._getFilePath(file), noop);
};

proto.renameFile = function renameFile(file, newFile) {
	var cache = this._cache;
	if (!newFile || !(file = cache.files[file]) 
			|| cache.files[newFile]) {
		return;
	}
	
	var path = this._getFilePath(file);
	delete cache.files[file.name];
	file.name = newFile;
	cache.files[newFile] = file;
	fs.rename(path, this._getFilePath(file), noop); //不考虑并发
	return true;
};

proto.setProperty = function setProperty(name, value) {
	this._cache.properties[name] = value;
	this._writeProperties();
};

proto.setProperties = function setProperties(obj) {
	if (!obj) {
		return;
	}
	
	var props = this._cache.properties;
	Object.keys(obj).forEach(function(key) {
		props[key] = obj[key];
	});
	this._writeProperties();
};

proto.getProperty = function getProperty(name) {
	return this._cache.properties[name];
};

module.exports = Storage;