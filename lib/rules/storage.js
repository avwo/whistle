var fs  = require('fs');
var fse = require('fs-extra');
var path = require('path');
var RETRY_INTERVAL = 6000;

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

function copyFileObj(file) {
	if (!file) {
		return file;
	}
	
	return {
		index: file.index,
		name: file.name,
		data: file.data,
		selected: file.selected
	};
}

function noop() {}

function Storage(dir) {
	var self = this;
	if (!(self instanceof Storage)) {
		return new Storage(dir);
	}
	
	fse.ensureDirSync(dir);
	
	self._files = path.join(dir, 'files');
	self._properties = path.join(dir, 'properties');
	fse.ensureDirSync(self._files);
	fse.ensureFileSync(self._properties);
	
	var maxIndex = -1;
	var files = {};
	fs.readdirSync(self._files)
			.forEach(function(file) {
				if (!/^(\d+)\.(.+)$/.test(file)) {
					return;
				}
				try {
					var index = parseInt(RegExp.$1, 10);
					var filename = decodeURIComponent(RegExp.$2);
					if (index > maxIndex) {
						maxIndex = index;
					}
					files[filename] = {
							index: index,
							name: filename,
							data: readFileSafe(path.join(self._files, file))
					};
				} catch(e) {}
			});
	
	self._cache = {
			maxIndex: maxIndex,
			files: files,
			properties: readJsonSafe(self._properties)
	};
	
}

var proto = Storage.prototype;

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

proto.existsFile = function existsFile(file) {
	
	return this._cache.files[file];
};

proto.getFileList = function getFileList() {
	var cache = this._cache;
	var list = [];
	Object.keys(cache.files)
				.forEach(function(file) {
					list.push(copyFileObj(cache.files[file]));
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

proto.updateFile = function updateFile(file, data) {
	
	return this.existsFile(file) && this.writeFile(file, data);
};

proto.readFile = function(file) {
	file = file && this._cache.files[file];
	return file && file.data;
};

proto.removeFile = function removeFile(file) {
	var files = this._cache.files;
	file = file && files[file];
	if (!file) {
		return;
	}
	
	delete files[file.name];
	fs.unlink(this._getFilePath(file), noop);
	return true;
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

proto.hasProperty = function hasProperty(name) {
	return name in this._cache.properties;
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
	return true;
};

proto.getProperty = function getProperty(name) {
	return this._cache.properties[name];
};

proto.removeProperty = function removeProperty(name) {
	if (this.hasProperty(name)) {
		delete this._cache.properties[name];
		this._writeProperties();
	}
};

module.exports = Storage;