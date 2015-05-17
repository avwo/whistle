define('/style/js/biz/init.js', function(require, exports, module) {
	var initActions = require('./actions');
	var initRules = require('./rules');
	var initAdvance = require('./advance');
	var initComposer = require('./composer');
	var initValues = require('./values');
	var detail = require('./detail');
	var list = require('./list');
	
	function addEvents() {
		var list = $('#captureList').on('dblclick', 'tr', function() {
			detail.show();
		}).on('click', 'tr', function(e) {
			!e.ctrlKey && list.find('tr').removeClass('selected');
			$(this).addClass('selected');
		});
		
		$('#quickSearch').on('input', function() {
			var rows = list.find('tr');
			var keywords = $.trim(this.value);
			if (!keywords) {
				rows.show();
				return;
			}
			keywords = keywords.toLowerCase().split(/\s+/g).slice(0, 5);
			rows.each(function() {
				var row = $(this);
				var text = (row.text() || '').toLowerCase();
				contains(text, keywords) ? row.show() : row.hide();
			});
		});
		
		$(window).on('keydown', function(e) {
			if (isEditable(e.target)) {
				return;
			}
			var keyCode = e.keyCode;
			var selectedElem = list.find('tr.selected:last');
			if (!selectedElem.length) {
				return;
			}
			var prev = keyCode == 38;
			if (prev || keyCode == 40) {
				prev  = prev ? getPrevVisible(selectedElem) : getNextVisible(selectedElem);
				if (prev.length > 0) {
					list.find('tr.selected').removeClass('selected');
					prev.addClass('selected');
					ensureVisible(prev);
				}
				e.preventDefault();
			}
		}).on('keyup', function(e) {
			if (isEditable(e.target)) {
				return;
			}
			if (e.keyCode == 13) {
				list.find('tr.selected:last').trigger('dblclick');
			}
		});
		
		function getPrevVisible(elem) {
			elem = elem.prev();
			while(elem.length && !elem.is(':visible')) {
				elem = elem.prev();
			}
			return elem;
		}
		
		function getNextVisible(elem) {
			elem = elem.next();
			while(elem.length && !elem.is(':visible')) {
				elem = elem.next();
			}
			return elem;
		}
		
		function contains(text, keywords) {
			return keywords[0] && text.indexOf(keywords[0]) != -1 || (keywords[1] && text.indexOf(keywords[1]) != -1)
				|| (keywords[2] && text.indexOf(keywords[2]) != -1) || (keywords[3] && text.indexOf(keywords[3]) != -1)
				|| (keywords[4] && text.indexOf(keywords[4]) != -1);
		}
		
		function isEditable(elem) {
			elem = elem.nodeName;
			return elem == 'TEXTAREA';
		}
		
		var top = list.offset().top;
		function ensureVisible(tr) {
			var _top = tr.offset().top - top;
			if (_top < 0) {
				list.scrollTop(list.scrollTop() + _top);
				return;
			}
			
			_top += tr[0].offsetHeight - list[0].offsetHeight;
			if (_top > 0) {
				list.scrollTop(list.scrollTop() + _top);
			}
		}
		
	}
	
	$('.timeline').attr('title', 'Stalled: 100ms\r\nDNS: 22ms\r\nRequest: 120ms\r\nResponse: 200ms\r\nContent Download: 500ms\r\n');
	
	addEvents();
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
