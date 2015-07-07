define('/style/js/biz/https.js', function(require, exports, module) {
	var listCon = $('#interceptRuleList');
	var domainInput = listCon.find('.intercept-rule-input');
	var ITEM_HTML = '<tr><td></td><td><button type="button" class="close"><span aria-hidden="true">&times;</span></button></td></tr>';
	var list = [];
	
	function addEvents() {
		listCon.on('click', '.close', function () {
			var self = $(this).closest('tr');
			var domain = self.find('td:first').text();
			self.remove();
			$.post('/cgi-bin/https/remove',{domain: domain});
			if ((domain = $.inArray(domain, list)) != -1) {
				list.splice(domain, 1);
			}
		});
		
		$(document.body).on('click', '.clear-intercept-rule', function () {
			if (!confirm("确认清空所有拦截https的rules？"))  {  
				return;
			}
			
			$.post('/cgi-bin/https/clear');
			list = [];
			listCon.html('');
		}).on('click', '.add-intercept-rule', function () {
			var domain = $.trim(domainInput.val());
			if (!domain) {
				alert('请输入拦截规则域名或正则表达式');
				return;
			}
			if (domain.length > 256) {
				alert('拦截规则不能超过256个字符');
				return;
			}
			$.post('/cgi-bin/https/add',{domain: domain});
			domainInput.val('');
		});
	}
	
	
	module.exports = function init(_list) {
		list = _list;
		var listHtml = new Array(list.length + 1);
		listCon.html(listHtml.join(ITEM_HTML));
		listCon.find('tr').each(function(i) {
			$(this).find('td:first').text(list[i]);
		});
		addEvents();
	};
});