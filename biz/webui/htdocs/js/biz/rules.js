define('/style/js/biz/rules.js', function(require, exports, module) {
	var hostsData, inited, values;
	var newHostsList = $('#newHostsList');
	var glyphiconOk = '<span class="glyphicon glyphicon-ok"></span>';
	
	var hostsEditor = CodeMirror($('#hostsEditor')[0], {
    	mode: 'text/whistle'
  	});
	
	var themeOptions = $('#themeOptions').change(function() {
		var theme = this.value;
		$.post('/cgi-bin/hosts/set-theme',{theme: theme});
		hostsEditor.setOption('theme', theme);
	});
	
	var fontSizeOptions = $('#fontSizeOptions').change(function() {
        var fontSize = this.value;
        $.post('/cgi-bin/hosts/set-font-size',{fontSize: fontSize});
        hostsEditor.getWrapperElement().style.fontSize = fontSize;
        hostsEditor.refresh();
	});
		
	var showLineNumbers = $('#showLineNumbers').change(function() {
		$.post('/cgi-bin/hosts/show-line-numbers',{showLineNumbers: this.checked ? 1 : 0});
		hostsEditor.setOption('lineNumbers', this.checked);
	});
	
	function initActionBar(data) {
		if (data.theme) {
			themeOptions.val(data.theme).trigger('change');
		}
		
		if (data.fontSize) {
			fontSizeOptions.val(data.fontSize).trigger('change');
		}
		
		showLineNumbers.prop('checked', data.showLineNumbers == true);
		showLineNumbers.trigger('change');
	}
	
	var body = $(document.body).on('click', '.hosts-list .list-group-item', function() {
		var self = $(this);
		if (self.hasClass('create-hosts')) {
			return;
		}
		
		var hostsList = self.closest('.hosts-list');
		var activeItem = hostsList.find('.list-group-item.active').removeClass('active');
		var hostsName = activeItem.text();
		
		if (activeItem.hasClass('public-hosts')) {
			hostsData.publicHosts = hostsEditor.getValue();
		} else {
			hostsData.hostsData[hostsName] = hostsEditor.getValue();
		}
		
		self.addClass('active');
		
		var hostsNav = $('#hostsNav');
		hostsName = self.text();
		
		hostsNav.find('.hosts-title').text(hostsName);
		
		if (self.hasClass('public-hosts')) {
			hostsNav.find('.remove-hosts').hide();
			hostsNav.find('.enable-public-hosts').show();
			hostsEditor.setValue(hostsData.publicHosts || '');
		} else {
			hostsNav.find('.remove-hosts').show();
			hostsNav.find('.enable-public-hosts').hide();
			hostsEditor.setValue(hostsData.hostsData[hostsName] || '');
		}
	}).on('dblclick', '.hosts-list .list-group-item', function() {
		$('.apply-hosts').trigger('click');
	});
	
	body.on('click', '.enable-public-hosts', function() {
		var enable = $('#enablePublicHosts').prop('checked');
		var glyphicon = $('#publicHosts').find('.glyphicon-ok');
		enable ? glyphicon.show() : glyphicon.hide();
		updatePublicHostsState();
		$.post('/cgi-bin/hosts/enable',{enable: enable ? 1 : 0});
	});
	
	function updatePublicHostsState() {
		var enable = $('#enablePublicHosts').prop('checked');
		$('#publicHosts').css('color', enable ? '' : '#ccc')
		.attr('title', enable ? '先到自定义规则查找，如果没有匹配的再查找Public rules' : '公用环境已禁用');
	}
	
	body.on('click', '.remove-hosts', function() {
		if (confirm("确认删除？"))  {  
			var hosts = newHostsList.find('.active');
			var name = hosts.text();
			
			$.post('/cgi-bin/hosts/remove',{name: name});
			var next = hosts.next();
			if (!next.length) {
				next = hosts.prev();
			}
			(next.length ? next : $('#publicHosts')).trigger('click');
			hosts.remove();
			delete hostsData.hostsData[name];
			updateCreateHostsBtnState();
		}
		
	});
	
	$('#hostsEditor').keyup(function(e) {
		console.log(e.metaKey)
		console.log(e.keyCode)
		if ((e.ctrlKey || e.metaKey)
				&& (e.keyCode == 13 || e.keyCode == 83)) {
			$('.apply-hosts').trigger('click');
		}
	}).keydown(function(e) {
		if (e.ctrlKey && e.keyCode == 83) {
			e.preventDefault();
			return false;
		}
	});
	
	body.on('click', '.apply-hosts,.confirm-hosts', function(e) {
		var self = $(this);
		var hostsList = $('#hostsList');
		var activeHosts = hostsList.find('.active');
		if (!activeHosts.length) {
			return;
		}
		
		var content = hostsEditor.getValue();
		
		if (activeHosts.hasClass('public-hosts')) {
			hostsData.publicHosts = content;
			$.post('/cgi-bin/hosts/save-public', {name: name, content: content});
		} else {
			var name = activeHosts.text();
			hostsData.hostsData[name] = content;
			$.post('/cgi-bin/hosts/save', {name: name, content: content});
			var glyphicon = newHostsList.find('.glyphicon-ok').remove();
			activeHosts.append(glyphicon.length ? glyphicon : glyphiconOk);
		}
		
		$('#hostsList').find('a.active').removeClass('changed');
		if (self.hasClass('confirm-hosts')) {
			$('.rules-dialog').modal('hide');
		}
	}).on('mouseenter', '.cm-js-type', function(e) {
		var self = $(this);
		if ((e.ctrlKey || e.metaKey) && getKey(self.text())) {
			self.addClass('has-key');
		}
	}).on('mouseenter', '.cm-js-weinre', function(e) {
		(e.ctrlKey || e.metaKey) && $(this).addClass('has-key');
	}).on('mouseleave', '.cm-js-type', function() {
		$(this).removeClass('has-key');
	}).on('click', '.cm-js-type', function(e) {
		var key, item;
		if (!e.ctrlKey && !e.metaKey) {
			return;
		}
		
		var self = $(this);
		var url = self.text();
		key = getKey(url);
		if (self.hasClass('cm-js-weinre')) {
			var weinreId;
			if (key) {
				weinreId = values[key];
			} else {
				weinreId = getKey(url, '<', '>') || getKey(url, '(', ')') || removeProtocol(url);
				if (!weinreId) {
					weinreId = url.substring(url.indexOf('://') + 3);
				}
			}
			
			if (weinreId) {
				openWeinre(weinreId);
				return;
			}
		}
		
		if (!key) {
			return;
		}

		$('.view-values').trigger('click');
		var valuesCon = $('#valuesList');
		var valuesList = valuesCon.find('a');
		for (var i = 0; i < valuesList.length; i++) {
			item = $(valuesList[i]);
			if (item.text() == key) {
				setTimeout(function() {
					item.trigger('click');
				}, 800);
				return;
			}
		}
		item = $('<a href="javascript:;" class="list-group-item" title="双击保存"></a>')
			.text(key).appendTo(valuesCon);
		setTimeout(function() {
			item.trigger('click');
			$('.apply-values').trigger('click');
		}, 800);
	
	});
	
	function removeProtocol(url) {
		var index = url.indexOf('://') + 3;
		return index != -1 ? url.substring(index) : url;
	}
	
	function getKey(url, start, end) {
		if (!url || !(url = $.trim(url))) {
			return null;
		}
		
		url = removeProtocol(url);
		if (url.indexOf(start || '{') == 0) {
			var index = url.lastIndexOf(end || '}');
			return index > 1 && url.substring(1, index);
		}
		
		return null;
	}
	
	$('#openWeinreBtn').click(function() {
		var weinreId = $.trim($('#weinreId').val());
		openWeinre(weinreId);
		$('#openWeinreDialog').modal('hide');
	});
	
	$('#weinreId').keyup(function(e) {
		e.keyCode == 13 && $('#openWeinreBtn').trigger('click');
	});
	
	function openWeinre(weinreId) {
		weinreId = (weinreId || 'weinre').substring(0, 120);
		window.open('http://weinre.local.whistlejs.com/client/#' + weinreId, weinreId);
	}
	
	var createHostsBtn = $('#createHostsBtn').click(function() {
		if (createHostsBtn.hasClass('disabled')) {
			return;
		}
		$('#createHostsDialog').modal();
		setTimeout(function() {
			try {$('#newHostsName').focus();} catch(e) {}
		}, 300);
	});
	
	var createHostsNameBtn = $('#createHostsNameBtn').click(function() {
		var name = $.trim($('#newHostsName').val());
		if (!name) {
			return;
		}
		
		for (var i in hostsData.hostsData) {
			if (i == name) {
				alert('该名称已存在。');
				return;
			}
		}
		createHosts(name).trigger('click');
		$.post('/cgi-bin/hosts/create', {name: name});
		$('#createHostsDialog').modal('toggle');
		updateCreateHostsBtnState();
		$('#newHostsName').val('');
		newHostsList.scrollTop(1000);
	});
	
	$('#newHostsName').keyup(function(e) {
		if (e.keyCode == 13) {
			createHostsNameBtn.trigger('click');
		}
	});
	
	function createHosts(name) {
		return $('<a href="javascript:;" class="list-group-item" title="双击切换环境"></a>').text(name).appendTo(newHostsList);
	}
	
	function updateCreateHostsBtnState() {
		if (newHostsList.find('.list-group-item').length >= 36) {
			createHostsBtn.addClass('disabled');
		} else {
			createHostsBtn.removeClass('disabled');
		}
	}
	
	function initRulesDialog() {
		if (inited) {
			return;
		}
		
		inited = true;
		
		if (hostsData == false) {
			loadData();
			return;
		};
		
		if (!hostsData) {
			return;
		}
		
		initActionBar(hostsData);
		var hostsList = hostsData.hostsList;
		var curHostsName = hostsData.curHostsName;
		var hasActive;
		for (var i = 0, len = hostsList.length; i < len; i++) {
			var name = hostsList[i];
			var item = createHosts(name);
			if (curHostsName == name) {
				item.append(glyphiconOk).trigger('click');
				hasActive = true;
				hostsEditor.setValue(hostsData.hostsData[name] || '');
				curHostsName = null;
			}
		}
		if (hostsData.disabled) {
			$('#publicHosts').find('.glyphicon-ok').hide();
			$('#enablePublicHosts').prop('checked', false);
		}
		updateCreateHostsBtnState();
		
		if (!hasActive) {
			$('#publicHosts').trigger('click');
		}
		
		updatePublicHostsState();
		setInterval(function() {
			var activeItem = $('#hostsList').find('a.active');
			var value = hostsEditor.getValue();
			var hosts = hostsData.hostsData[activeItem.text()];
			if (activeItem.hasClass('public-hosts')) {
				if((!value && !hostsData.publicHosts) || hostsData.publicHosts == value) {
					activeItem.removeClass('changed');
					return;
				}
			} else if((!value && !hosts) || hosts == value) {
					activeItem.removeClass('changed');
					return;
			}
			
			activeItem.addClass('changed');
		}, 360);
	}
	
	function addResizeEvents() {
		var editor = $('#hostsEditor')[0];
		var timeoutId;
		
		function resize() {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(function() {
				hostsEditor.setSize(editor.offsetWidth, editor.offsetHeight);
			}, 60);
		}
		
		$(window).on('resize', resize);
		resize();
	}
	
	module.exports = function init(data, valuesData, homePage) {
		hostsData = data || {};
		values = valuesData || {};
		$('#aboutVersion').text(hostsData.version);
		var aboutUrl = $('#aboutUrl');
		aboutUrl.attr('href', aboutUrl.attr('href').replace('{version}', hostsData.version));
		
		homePage ? initRulesDialog() : $('.rules-dialog').on('shown.bs.modal', initRulesDialog);
		$('#openWeinreDialog').on('shown.bs.modal', function() {
			setTimeout(function() {
				$('#weinreId').focus();
			}, 300);
		});
		
		var rulesSettingsList = $('#rulesSettingsList');
		$(document.body).on('click', function(e) {
			var target = $(e.target);
			if (!target.closest('#rulesSettings').length && !target.closest('#rulesSettingsList').length) {
				rulesSettingsList.hide();
			}
		});
		
		$('#rulesSettings').click(function() {
			rulesSettingsList.show();
		});
		
	};
	
	module.exports.resize = addResizeEvents;
});