var path = require('path');
var fs = require('fs');
var util = require('../../../../util');
var CAPTURE_DATA_PATH = path.join(util.LOCAL_DATA_PATH, 'captureData');
var URLS_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'urls');
var HEADERS_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'headers');
var BODIES_DATA_PATH = path.join(CAPTURE_DATA_PATH, 'bodies');
var REQ_PATH = path.join(BODIES_DATA_PATH, 'req');
var RES_PATH = path.join(BODIES_DATA_PATH, 'res');
var MAX_SIZE = 1024 * 1024;
var MAX_COUNT = exports.MAX_COUNT = 360;
var ONE_HOUR = exports.ONE_HOUR = 1000 * 60 * 60;
var CRLF_RE = /\n|\r\n\r/g;


util.mkdir(CAPTURE_DATA_PATH);
util.mkdir(URLS_DATA_PATH);
util.mkdir(HEADERS_DATA_PATH);
util.mkdir(BODIES_DATA_PATH);
util.mkdir(REQ_PATH);
util.mkdir(RES_PATH);

exports.URLS_DATA_PATH = URLS_DATA_PATH;
exports.HEADERS_DATA_PATH = HEADERS_DATA_PATH;
exports.REQ_PATH = REQ_PATH;
exports.RES_PATH = RES_PATH;
exports.MAX_SIZE = MAX_SIZE;

function getUrlFiles(start, end, callback) {
	fs.readdir(HEADERS_DATA_PATH, function(err, list) {
		var fileList = [];
		if (!err) {
			var startIndex = Math.floor((start || Date.now()) / ONE_HOUR);
			var endIndex = Math.floor((end || Date.now()) / ONE_HOUR);
			for (var i = 0, len = list.length; i < len; i++) {
				var filename = list[i];
				if (filename >= startIndex && filename <= endIndex) {
					fileList.push(filename);
				}
			}
			
			fileList.sort(function (prev, next) {
				return prev > next ? 1 : -1;
			});
		}
		
		
		callback(fileList);
	});
}

function getHeaderFiles(ids) {
	var result = {};
	var filename;
	ids.forEach(function(id) {
		if (filename = parseInt(id.trim().split('-')[0], 10)) {
			filename = Math.floor(filename / ONE_HOUR);
			result[filename] ? result[filename].push(id) : (result[filename] = [id]);
		}
	});
	
	return result;
}

function readFile(path, callback) {
	var content = '';
	var reader = fs.createReadStream(path, {encoding: 'utf8'});
	
	reader.on('data', function(data) {
		content += data;
		content = content.split(CRLF_RE);
		var endIndex = content.length - 1;
		if (endIndex > 0 && callback(content.slice(0, endIndex)) === false) {
			reader.close();
			return;
		}
		content = content[endIndex];
	});
	
	reader.on('error', function(err) {
		callback(false, err);
	});
	
	reader.on('end', function() {
		if (content && callback(content.split(CRLF_RE)) === false) {
			return;
		}
		callback();
	});
}

function readFiles(list, callback) {
	if (!list.length) {
		return callback();
	}
	
	readFile(list.shift(), function(lines) {
		if (!lines) {
			return readFiles(list, callback);
		}
		return callback(lines);
	});
}

exports.getUrls = function getUrls(start, end, keyword, callback) {
	var id;
	var result = [];
	
	if (start && /[^\d]/.test(start)) {
		id = start;
		start = parseInt(start.trim().split('-')[0], 10);
	}
	
	start = start || Date.now() - 100;
	end = end || Date.now() + 100;
	
	getUrlFiles(start, end, function(list) {
		if (!list.length) {
			return callback(result);
		}
		
		readFiles(list.map(function(file) {
			return path.join(URLS_DATA_PATH, file);
		}), id ? handleLineById : handleLineByTime);
	});
	
	start += '-';
	
	function handleLineById(lines) {
		if (!lines) {
			callback(result);
			return false;
		}
		
		var line;
		for (var i = 0, len = lines.length; i < len; i++) {
			if (line = lines[i].trim()) {
				if (!id) {
					result.push(line);
					line = result.length < MAX_COUNT;
				} else if (line.indexOf(id) != -1) {
					id = null;
				}
			}
		}
		
		if (line === false) {
			callback(result);
			return line;
		}
	}
	
	function handleLineByTime(lines) {
		if (!lines) {
			callback(result);
			return false;
		}
		
		var line;
		for (var i = 0, len = lines.length; i < len; i++) {
			if ((line = lines[i].trim()) && line >= start) {
				result.push(line);
				line = result.length < MAX_COUNT
			}
		}
		
		if (line === false) {
			callback(result);
			return line;
		}
	}
};

exports.getHeaders = function getHeaders(ids, callback) {
	var result = {};
	if (!ids || !ids.length) {
		return callback(result);
	}
	
	var files = getHeaderFiles(ids);
	var keys = Object.keys(files);
	var count = keys.length;
	if (!count) {
		return callback(result);
	}
	
	keys.forEach(function(file) {
		var list = files[file];
		var len = list.length;
		readFiles([path.join(HEADERS_DATA_PATH, file)], function(lines) {
			if (!lines) {
				if (--count <= 0) {
					callback(result);
				}
				return false;
			}
			
			var linesCount = lines.length;
			for (var i = 0; i < len; i++) {
				var id = list[i];
				for (var j = 0; j < linesCount; j++) {
					var line = lines[j];
					if (!line.indexOf(id)) {
						result[id] = line;
						break;
					}
				}
			}
		});
	});
};

exports.getReqBody = function getReqBody(id) {
	return fs.createReadStream(path.join(REQ_PATH, id + ''));
};

exports.getResBody = function getResBody(id) {
	return fs.createReadStream(path.join(RES_PATH, id + ''));
};

