var fs = require('fs');
var path = require('path');
var config = require('../config');
var util = require('../../../../util');
var dataUtil = require('./util');
var ONE_DAY = dataUtil.ONE_HOUR * 24;

function clean() {
	var end = Date.now() - ONE_DAY * (parseInt(config.days, 10) || 10);
	fs.readdir(dataUtil.URLS_DATA_PATH, function(err, list) {
		if (err) {
			return;
		}
		var last = Math.floor(end / dataUtil.ONE_HOUR) + '';
		removeFiles(dataUtil.URLS_DATA_PATH, list, last);
		fs.readdir(dataUtil.HEADERS_DATA_PATH, function(err, list) {
			if (err) {
				return;
			}
			removeFiles(dataUtil.HEADERS_DATA_PATH, list, last);
			
			last = end + '';
			fs.readdir(dataUtil.REQ_PATH, function(err, list) {
				if (err) {
					return;
				}
				removeFiles(dataUtil.REQ_PATH, list, last);
			});
			
			fs.readdir(dataUtil.RES_PATH, function(err, list) {
				if (err) {
					return;
				}
				removeFiles(dataUtil.RES_PATH, list, last);
			});
		});
	});
}

function removeFiles(dir, list, last) {
	list.forEach(function(file) {
		file < last && fs.unlink(path.join(dir, file), util.noop);
	});
}

module.exports = function init() {
	clean();
	setInterval(clean, 60000 * 60 * 24);
};

