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

