define('/style/js/biz/https.js', function(require, exports, module) {
	var listCon = $('#interceptRuleList');
	var domainInput = $('.intercept-rule-input');
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
		}).on('click', '.add-intercept-rule', function (e, domain) {
			domain = domain || $.trim(domainInput.val());
			if (!domain) {
				alert('请输入拦截的域名或正则表达式');
				return;
			}
			if (domain.length > 256) {
				alert('拦截规则不能超过256个字符');
				return;
			}
			
			if (/\s/.test(domain)) {
				alert('中间不能有空格');
				return;
			}
			
			if ($.inArray(domain, list) != -1) {
				alert('该规则已存在');
				return;
			}
			$.post('/cgi-bin/https/add',{domain: domain});
			domainInput.val('');
			$(ITEM_HTML).appendTo(listCon).find('td:first').text(domain);
			list.push(domain);
		});
		
		domainInput.on('keyup', function(e) {
			e.keyCode == 13 && $('.add-intercept-rule').trigger('click');
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