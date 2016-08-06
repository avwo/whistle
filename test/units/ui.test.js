
var util = require('../util.test');

module.exports = function() {
	util.request('http://local.whistlejs.com/index.html?doNotParseJson');
	util.request('http://local.whistlejs.com/cgi-bin/log/get');
	util.request('http://local.whistlejs.com/cgi-bin/init');
	util.request('http://local.whistlejs.com/cgi-bin/get-data');
	util.request('http://local.whistlejs.com/cgi-bin/server-info');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/plugins/get-plugins');
	util.request('http://local.whistlejs.com/cgi-bin/rules/list');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
};