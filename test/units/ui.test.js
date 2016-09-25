
var util = require('../util.test');

module.exports = function() {
	util.request('http://local.whistlejs.com/index.html?doNotParseJson');
	util.request('http://local.whistlejs.com:1234/index.html?doNotParseJson');
	util.request('http://local.whistlejs.com/cgi-bin/log/get');
	util.request('http://local.whistlejs.com/cgi-bin/init');
	util.request('http://local.whistlejs.com:2345/cgi-bin/init');
	util.request('http://local.whistlejs.com/cgi-bin/get-data');
	util.request('http://local.whistlejs.com/cgi-bin/server-info');
	util.request('http://local.whistlejs.com/cgi-bin/values/list');
	util.request('http://local.whistlejs.com/cgi-bin/plugins/get-plugins');
	util.request('http://local.whistlejs.com/cgi-bin/rules/list');
	util.request('ws://test.local.whistlejs.com/cgi-bin/rules/list', function(data) {
	  data.headers.should.have.property('host', 'test.local.whistlejs.com');
	});
	util.request('wss://test.local.whistlejs.com/cgi-bin/rules/list', function(data) {
    data.headers.should.have.property('host', 'test.local.whistlejs.com');
  });
	
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/add',
		method: 'post',
		form: {
			name: 'test',
			value: '123'
		}
	}, function() {
		util.request({
			url: 'http://local.whistlejs.com/cgi-bin/values/rename',
			method: 'post',
			form: {
				name: 'test',
				newName: '123'
			}
		}, function() {
			util.request({
				url: 'http://local.whistlejs.com/cgi-bin/values/remove',
				method: 'post',
				form: {
					name: '123'
				}
			});
		});
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/set-current',
		method: 'post',
		form: {
			name: 'test'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/set-font-size',
		method: 'post',
		form: {
			valuesFontSize: '14px'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/set-theme',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/show-line-numbers',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/move-up',
		method: 'post',
		form: {
			name: 'test'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/values/move-down',
		method: 'post',
		form: {
			name: 'test'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/plugins/disable-plugin',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/plugins/disable-all-plugins',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/disable-all-rules',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/add',
		method: 'post',
		form: {
			name: 'test',
			value: '/test/ file://xxx'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/disable-default',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/enable-default',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/remove',
		method: 'post',
		form: {
			name: 'test',
			value: '/test/ file://xxx'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/rename',
		method: 'post',
		form: {
			name: 'test',
			newName: 'sssss'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/select',
		method: 'post',
		form: {
			name: 'test'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/set-current',
		method: 'post',
		form: {
			name: 'test'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/set-font-size',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/set-theme',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/show-line-numbers',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/unselect',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/allow-multiple-choice',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/sync-with-sys-hosts',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/set-sys-hosts',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/log/set',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/composer',
		method: 'post',
		form: {
			url: 'http://test.whistlejs.com/'
		}
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/set-filter',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/intercept-https-connects',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/hide-https-connects',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/do-not-show-again',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/check-update',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/move-down',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/move-up',
		method: 'post'
	});
	util.request({
		url: 'http://local.whistlejs.com/cgi-bin/rules/get-sys-hosts',
		method: 'post'
	});
};