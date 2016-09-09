var util = require('../util.test');
var config = require('../config.test');

module.exports = function() {
	util.proxy('http://test.whistlejs.com');
	util.proxy('http://tnl1.whistlejs.com');
	util.proxy('http://tnl2.whistlejs.com');
	util.proxy('http://tnl3.whistlejs.com');
};