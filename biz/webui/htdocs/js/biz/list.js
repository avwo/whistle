define('/style/js/biz/list.js', function(require, exports, module) {
	var container = $('#captureList');
	var body = $('#captureListBody');
	var quickSearch = $('#quickSearch');
	var captureDetail = $('#captureDetail');
	var captureDetailContent = $('#captureDetailContent');
	var captureDetailTabs = captureDetail.find('.tabs button');
	var	MAX_COUNT = 720;
	var ids = [];
	var data = {};
	var index = 0;
	var pending, selectedData;
	
	var AMP    = /&/g,
	    LT     = /</g,
	    GT     = />/g,
	    QUOT   = /\"/g,
	    CRLF   = /\r\n|\n|\r/g,
	    SQUOT  = /\'/g;
	
	function escapeHtml(s) {
	    return typeof s === 'string' ? s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;')
	  	      .replace(QUOT,'&quot;').replace(SQUOT, '&#39;').replace(CRLF, '<br>').
	  	      replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\s/g, '&nbsp;') : (s == null ? '' : String(s));
	}
	
	function getList(options) {
		if (pending) {
			return;
		}
		pending = true;
		
		return $.ajax({
			url: '/cgi-bin/list/get',
			dataType: 'json',
			timeout: 5000,
			type: 'post',
			data: options,
			success: handleData,
			complete: function() {
				setTimeout(load, 1000);
			}
		});
	}
	
	function load() {
		var id;
		var pendingIds = [];
		for (var i = 0, len = ids.length; i < len; i++) {
			id = ids[i];
			var curData = data[id];
			if (curData && !curData.endTime) {
				pendingIds.push(id);
			}
		}
		var startTime = ids.length < MAX_COUNT ? id : -1;
		
		function _load() {
			pending = false;
			getList({
				ids: pendingIds.join(),
				startTime: startTime
			});
		}
		
		if (startTime == -1 && !pendingIds.length) {
			setTimeout(_load, 3000);
		} else {
			_load();
		}
	}
	
	function handleData(json) {
		ids = ids.concat(json.newIds);
		for (var i = 0, len = ids.length; i < len; i++) {
			var id = ids[i];
			var curData = json.data[id];
			if (curData) {
				data[id] = curData;
			}
		}
		createList();
	}
	
	function createList() {
		var list = body.find('tr');
		list.filter('.pending').each(function() {
			var self = $(this);
			var curData = data[self.attr('id')];
			curData && updateElement(self, curData);
		});
		
		var last = list.filter(':last');
		var lastId = last.attr('id');
		lastId = lastId ? $.inArray(lastId, ids) + 1 : 0;
		var bottom = atBottom();
		var exceedCount = list.length - MAX_COUNT + (bottom ? 1 : 0);
		if (exceedCount > 0) {
			removeElements(list.slice(0, exceedCount));
		}
		
		var html = [];
		for (var len = ids.length; lastId < len; lastId++) {
			html.push(getHtml(data[ids[lastId]]));
		}
		body.append(html.join(''));
		html.length && search();
		bottom && container.scrollTop(1000000);
	}
	
	function getHtml(data) {
		if (!data) {
			return '';
		}
		var res = data.res;
		var req = data.req;
		var defaultValue = data.reqError ? 'aborted' : (data.resError ? 'error' : '-');
		var url = escapeHtml(data.url);
		var type = escapeHtml(res.headers ? (res.headers['content-type'] || '') : defaultValue);
		return '<tr id="' + data.id + '" class="' + (data.endTime ? getClassname(data) : 'pending') + '">\
			        <th class="order" scope="row">' + ++index + '</th>\
			        <td class="result">' + (res.statusCode || defaultValue) + '</td>\
			        <td class="protocol">' + getProtocol(data.url) + '</td>\
			        <td class="method">' + req.method + '</td>\
			        <td class="host">' + getHostname(data.url) + '</td>\
			        <td class="host-ip">' + (res.ip || defaultValue) + '</td>\
			        <td class="url" title="' + url + '">' + url + '</td>\
			        <td class="type" title="' + type + '">' + type + '</td>\
			        <td class="time">' + (data.endTime ? data.endTime - data.startTime + 'ms' : defaultValue) + '</td>\
			     </tr>';
	}
	
	function updateElement(elem, data) {
		var res = data.res;
		var defaultValue = data.reqError ? 'aborted' : (data.resError ? 'error' : '-');
		elem.find('.result').text(res.statusCode || defaultValue);
		elem.find('.host-ip').text(res.ip || defaultValue);
		elem.find('.type').text(res.headers ? (res.headers['content-type'] || '') : defaultValue);
		elem.find('.time').text(data.endTime ? data.endTime - data.startTime + 'ms' : defaultValue);
		elem.addClass(getClassname(data));
		if (data.endTime) {
			elem.removeClass('pending');
		}
	}
	
	
	function getHostname(url) {
		var index = url.indexOf(':\/\/') + 3;
		return url.substring(index, url.indexOf('\/', index));
	}
	
	function getProtocol(url) {
		return url.substring(0, url.indexOf(':\/\/')).toUpperCase();
	}
	
	function getClassname(data) {
		if (data.reqError || data.resError || data.res.statusCode >= 400) {
			return 'danger';
		}
		var headers = data.res.headers;
		switch(getContentType(headers)) {
			case 'JS':
				return 'warning';
			case 'CSS':
				return 'info';
			case 'HTML':
				return 'success';
			case 'IMG':
				return 'active';
		}
		
		return '';
	}
	
	function getContentType(contentType) {
		if (contentType && typeof contentType != 'string') {
			contentType = contentType['content-type'] || contentType.contentType;
		}
		
		if (typeof contentType == 'string') {
			contentType = contentType.toLowerCase();
			if (contentType.indexOf('javascript') != -1) {
		        return 'JS';
		    }
			
			if (contentType.indexOf('css') != -1) {
		        return 'CSS';
		    }
			
			if (contentType.indexOf('html') != -1) {
		        return 'HTML';
		    }
			
			if (contentType.indexOf('json') != -1) {
		        return 'JSON';
		    }
			
			if (contentType.indexOf('text/') != -1) {
		        return 'TEXT';
		    }
			
			if (contentType.indexOf('image') != -1) {
		        return 'IMG';
		    } 
		}
		
		return null;
	}
	
	function removeElements(elems) {
		elems.each(function() {
			var id = this.id;
			delete data[id];
			var index = $.inArray(id, ids);
			if (index != -1) {
				ids.splice(index, 1);
			}
		}).remove();
	}
	
	function atBottom() {
		var conHeight = container[0].offsetHeight + 2;
		var bodyHeight = body[0].offsetHeight;
		
		return bodyHeight <= conHeight || (bodyHeight - container.scrollTop() < conHeight);
	}
	
	function search() {
		var rows = body.find('tr');
		var keywords = $.trim(quickSearch.val());
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
	}
	
	function contains(text, keywords) {
		return keywords[0] && text.indexOf(keywords[0]) != -1 || (keywords[1] && text.indexOf(keywords[1]) != -1)
			|| (keywords[2] && text.indexOf(keywords[2]) != -1) || (keywords[3] && text.indexOf(keywords[3]) != -1)
			|| (keywords[4] && text.indexOf(keywords[4]) != -1);
	}
	
	function addEvents() {
		$('#clearAll').click(function() {
			body.html('');
			data = {};
			ids = [];
			index = 0;
			quickSearch.val('');
		});
		
		container.on('scroll', function() {
			if (atBottom()) {
				var list = body.find('tr');
				var exceedCount = list.length - MAX_COUNT;
				if (exceedCount >= 0) {
					removeElements(list.slice(0, exceedCount + 1));
				}
			}
		});
		
		quickSearch.on('input', search);
		
		body.on('dblclick', 'tr', function() {
			selectedData = data[this.id];
			if (!selectedData) {
				captureDetail.hide();
				return;
			}
			captureDetail.show();
			resizeDetail();
			var activeElem = captureDetailTabs.filter('.active');
			if (!activeElem.length) {
				activeElem = captureDetailTabs.filter('.request');
			}
			activeElem.trigger('click', {force: true});
		}).on('click', 'tr', function(e) {
			!e.ctrlKey && !e.metaKey && body.find('tr').removeClass('selected');
			$(this).addClass('selected');
		});
		
		function resizeDetail() {
			captureDetail.css('height', container[0].offsetHeight - 6);
			captureDetailContent.find('>div,>textarea').height(captureDetailContent[0].offsetHeight / 2);
		}
		
		$(window).on('resize', resizeDetail)
		.on('keydown', function(e) {
			if (isEditable(e.target)) {
				if (e.target.readOnly && e.keyCode === 8) {
					e.preventDefault();
				}
				return;
			}
			var keyCode = e.keyCode;
			var selectedElem = body.find('tr.selected:last');
			if (!selectedElem.length) {
				return;
			}
			var prev = keyCode == 38;
			if (prev || keyCode == 40) {
				prev  = prev ? getPrevVisible(selectedElem) : getNextVisible(selectedElem);
				if (prev.length > 0) {
					body.find('tr.selected').removeClass('selected');
					prev.addClass('selected');
					ensureVisible(prev);
				}
				e.preventDefault();
			}
		}).on('keyup', function(e) {
			if (e.keyCode == 27) {
				captureDetail.hide();
			}
			
			if (isEditable(e.target)) {
				return;
			}
			if (e.keyCode == 13) {
				body.find('tr.selected:last').trigger('dblclick');
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
		
		function isEditable(elem) {
			elem = elem.nodeName;
			return elem == 'TEXTAREA';
		}
		
		var top = body.offset().top;
		function ensureVisible(tr) {
			var _top = tr.offset().top - top;
			if (_top < 0) {
				body.scrollTop(body.scrollTop() + _top);
				return;
			}
			
			_top += tr[0].offsetHeight - body[0].offsetHeight;
			if (_top > 0) {
				body.scrollTop(body.scrollTop() + _top);
			}
		}
		
		captureDetail.on('click', '.close', function() {
			captureDetail.hide();
		});
		
		captureDetail.on('click', '.replay', function() {
			request({
					url: selectedData.url,
					method: selectedData.req.method,
					headers: JSON.stringify(selectedData.req.headers),
					body: selectedData.req.body || null
				});
		}).on('click', '.composer', function() {
			if (!selectedData) {
				return;
			}
			
			$('#composerUrl').val(selectedData.url);
			$('#composerHeaders').val(JSON.stringify(selectedData.req.headers));
			$('#composerBody').val(selectedData.req.body || null);
			$('#composerMethod').val(selectedData.req.method);
		});
		
		var delayTimeout;
		captureDetailTabs.on('click', function(e, data) {
				var self = $(this);
				if (!(data && data.force) && self.hasClass('active')) {
					return;
				}
				
				captureDetailTabs.removeClass('active');
				self.addClass('active');
				
				var headers = captureDetailContent.find('.headers');
				var body = captureDetailContent.find('.body');
				var textarea = captureDetailContent.find('.text-body').hide();
				var req = selectedData.req;
				var res = selectedData.res;
				
				if (self.hasClass('statistics')) {
					body.show();
					textarea.hide();
					headers.html(getProperties({
						Url: selectedData.url,
						Method: req.method,
						StatusCode: res.statusCode,
						'Host Ip': res.ip,
						'Client IP': req.ip,
						'Start Time': selectedData.startTime,
						DNS: selectedData.dnsTime - selectedData.startTime + 'ms',
						Request: selectedData.requestTime  && (selectedData.requestTime - selectedData.startTime + 'ms'),
						Response: selectedData.responseTime &&  (selectedData.responseTime - selectedData.startTime + 'ms'),
						'Content Loaded': selectedData.endTime && (selectedData.endTime - selectedData.startTime + 'ms')
					}));
					var rules = selectedData.rules || {};
					body.html(getProperties({
						Req: rules.req && rules.req.raw,
						Proxy: rules.proxy && rules.proxy.raw,
						Rule: rules.rule && rules.rule.raw,
						Res: rules.res && rules.res.raw,
						Weinre: rules.weinre && rules.weinre.raw
					}));
					
				} else if (self.hasClass('request')) {
					var reqHeaders = req.headers;
					headers.html(getProperties(reqHeaders));
					clearTimeout(delayTimeout);
					body.hide();
					textarea.val('').css('display', 'block');
					delayTimeout = setTimeout(function() {
						body.hide();
						textarea.val(req.body || '');
					}, 16);
				} else if (self.hasClass('response')) {
					var resHeaders = res.headers;
					if (resHeaders) {
						delete resHeaders['x-remote-ip'];
						for (var i in resHeaders) {
							if (/^x-whistle-/.test(i)) {
								delete resHeaders[i];
							}
						}
					}
					
					headers.html(getProperties(resHeaders));
					clearTimeout(delayTimeout);
					body.hide();
					textarea.val('').css('display', 'block');
					delayTimeout = setTimeout(function() {
						body.hide();
						textarea.val(res.body || '');
					}, 16);
				}
			});
		
		$('#executeComposer').click(function() {
			var url = $.trim($('#composerUrl').val());
			if (!url) {
				alert('url不能为空');
				return;
			}
			request({
				url: url,
				method: $('#composerMethod').val(),
				headers: $('#composerHeaders').val(),
				body: $('#composerBody').val()
			});
			$('.composer-dialog').modal('hide');
		});
		
		$('#showTimeline').click(function() {
			
			$('.timeline-dialog').modal();
		});
	}
	
	function request(data) {
		$.ajax({
			url: '/cgi-bin/composer/request',
			method: 'POST',
			data: data
		});
	}
	
	function getProperties(data) {
		var table = ['<ul>'];
		for (var i in data) {
			table.push('<li><label>' + escapeHtml(i) + ':</label><span>' + escapeHtml(data[i]) + '</span></li>')
		}
		table.push('</ul>');
		
	    return table.join('');
	}
	
	module.exports = function init() {
		getList();
		addEvents();
	};
});