define('/style/js/biz/home.js', function(require, exports, module) {
	var initRules = require('./rules');
	var initValues = require('./values');
	var initServerInfo = require('./server-info');
	
	function addEvents() {
		var actionList = $('#moreActionList').click(function() {
			actionList.hide();
		});
		
		$(document.body).on('click', function(e) {
			var target = $(e.target);
			if (!target.closest('#moreActions').length && !target.closest('.action-list').length) {
				actionList.hide();
			}
		});
		
		$('#moreActions').click(function() {
			actionList.show();
		});
	}
	
	initRules.resize();
	
	$.ajax({
		url: '/cgi-bin/init',
		dataType: 'json',
		success: function(data) {
			data = data || {};
			initRules(data.rules, data.values && data.values.values, true);
			initValues(data.values);
			initServerInfo(data.server);
			addEvents();
		},
		error: function() {
			alert('数据加载失败，请刷新页面重试.')
		}
	});
});
