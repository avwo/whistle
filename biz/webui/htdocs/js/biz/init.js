define('/style/js/biz/init.js', function(require, exports, module) {
	var initActions = require('./actions');
	var initRules = require('./rules');
	var initAdvance = require('./advance');
	var initComposer = require('./composer');
	var initValues = require('./values');
	var initList = require('./list');
	
	$('.timeline').attr('title', 'Stalled: 100ms\r\nDNS: 22ms\r\nRequest: 120ms\r\nResponse: 200ms\r\nContent Download: 500ms\r\n');
	
	initList();
	initActions();
	initAdvance();
	initComposer();
	
	$.ajax({
		url: '/cgi-bin/init',
		dataType: 'json',
		success: function(data) {
			data = data || {};
			initRules(data.rules, data.values && data.values.values);
			initValues(data.values);
		},
		error: function() {
			alert('数据加载失败，请刷新页面重试.')
		}
	});
});
