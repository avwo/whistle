define('/style/js/biz/init.js', function(require, exports, module) {
	var initActions = require('./actions');
	var initRules = require('./rules');
	var initAdvance = require('./advance');
	var initValues = require('./values');
	var initList = require('./list');
	var initHttps = require('./https');
	
	initList();
	initActions();
	initAdvance();
	
	$.ajax({
		url: '/cgi-bin/init',
		dataType: 'json',
		success: function(data) {
			data = data || {};
			initRules(data.rules, data.values && data.values.values);
			initValues(data.values);
			initHttps(data.https);
		},
		error: function() {
			alert('数据加载失败，请刷新页面重试.')
		}
	});
});
