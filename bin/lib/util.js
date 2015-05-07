var path = require('path');

exports.resolvePath = function resolvePath(name) {
	return /^[\w-]+$/.test(name) ? name : path.resolve(name);
};

exports.argv = {
		port : false, //is not path
		plugins : false,
		username : false,
		password : false,
		rules : true,
		uipath : true,
		timeout : false,
		sockets: false,
		days: false
	};

