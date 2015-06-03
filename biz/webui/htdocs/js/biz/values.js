define('/style/js/biz/values.js', function(require, exports, module) {
	var VALUES, THEME, editor;
	
	function addEvents() {
		var keyName = $('#keyName');
		var list = $('#valuesList').on('click', 'a', function() {
			var self = $(this);
			if (self.hasClass('active')) {
				return;
			}
			$('.values-content').show();
			initEidtor();
			
			list.find('a.active').removeClass('active');
			self.addClass('active');
			var key = self.text();
			keyName.text(key);
			editor.setValue(VALUES[key] || '');
			
			var top = list.offset().top;
			var _top = self.offset().top - top;
			if (_top < 0) {
				list.scrollTop(list.scrollTop() + _top);
				return;
			}
			
			_top += self[0].offsetHeight - list[0].offsetHeight;
			if (_top > 0) {
				list.scrollTop(list.scrollTop() + _top);
			}
			
		}).on('dblclick', 'a', function() {
			$('.apply-values').trigger('click');
		});
		
		$('.apply-values').click(function() {
			if (!editor) {
				return;
			}
			var elem = list.find('a.active');
			if (!elem.hasClass('changed')) {
				return;
			}
			elem.removeClass('changed');
			var key = elem.text();
			var value = VALUES[key] = editor.getValue();
			$.ajax({
				url: '/cgi-bin/values/set',
				dataType: 'json',
				type: 'POST',
				data: {
					key: key,
					value: value
				}
			});
		
		});
		
		$('#keyValue').keydown(function(e) {
			if ((e.ctrlKey || e.metaKey)
					&& (e.keyCode == 13 || e.keyCode == 83)) {
				$('.apply-values').trigger('click');
			}
		}).keydown(function(e) {
			if ((e.ctrlKey || e.metaKey) && e.keyCode == 83) {
				e.preventDefault();
				return false;
			}
		});
		
		$('.confirm-values').click(function() {
			$('.apply-values').trigger('click');
			$('.values-dialog').modal('hide');
		});
		
		$('.values-dialog').on('shown.bs.modal', function() {
			var activeElem = list.find('a.active');
			if (activeElem.length) {
				return;
			}
			
			list.find('a:first').trigger('click');
			
			initActionBar(THEME);
		});
		
		function initEidtor() {
		  initEidtor = function() {};
	      editor = CodeMirror($('#keyValue')[0], {
	        mode: {
			        name: "htmlmixed",
			        scriptTypes: [{matches: /\/x-handlebars-template|\/x-mustache/i,
			                       mode: null},
			                      {matches: /(text|application)\/(x-)?vb(a|script)/i,
			                       mode: "vbscript"}]
			      },
	        selectionPointer: true
	      });
	      
	      setInterval(function() {
				var elem = list.find('a.active');
				if (elem.hasClass('changed')) {
					return;
				}
				var key = elem.text();
				if ((editor.getValue() || '') != (VALUES[key] || '')) {
					elem.addClass('changed');
				} else {
					elem.removeClass('changed');
				}
			}, 360);
		}
		
		$('#removeKeyValue').click(function() {
			if (confirm("确认删除？"))  {  
				var key = $.trim(keyName.text());
				if (key) {
					delete VALUES[key];
					$.ajax({
						url: '/cgi-bin/values/remove',
						dataType: 'json',
						type: 'POST',
						data: {key: key}
					});
				}
				
				var elem = list.find('a.active');
				var next = elem.next();
				if (!next.length) {
					next = elem.prev();
				}
				elem.remove();
				$('.values-content').hide();
				next.trigger('click');
			}
		});
		
		$('#createKeyValue').click(function() {
			$('#createValuesDialog').modal();
			setTimeout(function() {
				$('#newValuesKey').focus();
			}, 300);
		});
		
		$('#createValuesKeyBtn').click(function() {
			var key = $.trim($('#newValuesKey').val());
			if (!key) {
				alert('key不能为空');
				return;
			}
			
			if (/\s/.test(key)) {
				alert('中间不能有空格');
				return;
			}
			
			if (key in VALUES) {
				alert('该key已存在');
				return;
			}
			$('<a href="javascript:;" class="list-group-item changed" title="双击保存"></a>')
				.text(key).appendTo(list).trigger('click');
			$('#createValuesDialog').modal('hide');
			initActionBar(THEME);
			$('.apply-values').trigger('click');
		});
		
		$('#newValuesKey').on('keyup', function(e) {
			e.keyCode == 13 && $('#createValuesKeyBtn').trigger('click');
		});
		
		addSettingsEvents();
	}
	
	function addSettingsEvents() {
		var valuesSettingsList = $('#valuesSettingsList');
		$(document.body).on('click', function(e) {
			var target = $(e.target);
			if (!target.closest('#valuesSettings').length && !target.closest('#valuesSettingsList').length) {
				valuesSettingsList.hide();
			}
		});
		
		$('#valuesSettings').click(function() {
			valuesSettingsList.show();
		});
		
	}
	
	var themeOptions = $('#valuesThemeOptions').change(function() {
		var theme = this.value;
		THEME.theme = theme;
		$.post('/cgi-bin/values/set-theme',{theme: theme});
		editor && editor.setOption('theme', theme);
	});
	
	var fontSizeOptions = $('#valuesFontSizeOptions').change(function() {
        var fontSize = this.value;
        THEME.fontSize = fontSize;
        $.post('/cgi-bin/values/set-font-size',{fontSize: fontSize});
        if (editor) {
        	editor.getWrapperElement().style.fontSize = fontSize;
            editor.refresh();
        }
	});
		
	var showLineNumbers = $('#valuesShowLineNumbers').change(function() {
		var showLineNumbers = this.checked ? 1 : 0;
		 THEME.showLineNumbers = !!showLineNumbers;
		$.post('/cgi-bin/values/show-line-numbers',{showLineNumbers: showLineNumbers});
		editor && editor.setOption('lineNumbers', this.checked);
	});
	
	function initActionBar(data) {
		themeOptions.val(data.theme || 'cobalt').trigger('change');
		fontSizeOptions.val(data.fontSize || '16px').trigger('change');
		
		showLineNumbers.prop('checked', data.showLineNumbers == true);
		showLineNumbers.trigger('change');
	}
	
	module.exports = function initValues(data) {
		data = data || {};
		VALUES = data.values || {};
		THEME = data;
		var keys = Object.keys(VALUES);
		for (var i = 0; i < keys.length; i++) {
			keys[i] = $('<a href="javascript:;" class="list-group-item" title="双击保存"></a>').text(keys[i]);
		}
		
		$('#valuesList').html(keys);
		addEvents();
	};
});