define('/style/js/biz/list.js', function(require, exports, module) {
	var container = $('#captureList');
	var body = $('#captureListBody');
	var quickSearch = $('#quickSearch');
	var captureDetail = $('#captureDetail');
	var captureDetailContent = $('#captureDetailContent');
	var captureDetailTabs = captureDetail.find('.tabs button');
	var	MAX_COUNT = 1024;
	var ids = [];
	var data = {};
	var index = 0;
	var pending, selectedData, selectedElement;
	
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
	
	function getSelectedData() {
		return selectedData ? (data[selectedData.id] || selectedData) : null;
	}
	
	function getList(options) {
		if (pending) {
			return;
		}
		pending = true;
		
		return $.ajax({
			url: '/cgi-bin/list/get',
			dataType: 'json',
			timeout: 10000,
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
			if (curData && !curData.endTime && !curData.close) {
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
		for (var i = 0, len = json.ids && json.ids.length; i < len; i++) {
			var id = json.ids[i];
			if (!json.data[id]) {
				$('#' + id).removeClass('pending');
				var curData = data[id];
				if (curData) {
					curData.close = true;
				}
			}
		}
		createList();
	}
	
	function createList() {
		var list = body.find('tr');
		list.filter('.pending').each(function() {
			var self = $(this);
			var curData = data[self.attr('id')];
			curData ? updateElement(self, curData) : self.removeClass('pending');
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
		bottom && container.scrollTop(body[0].offsetHeight);
	}
	
	function getHtml(data) {
		if (!data) {
			return '';
		}
		var res = data.res;
		var req = data.req;
		var url = escapeHtml(data.url);
		var errorMsg = getErrorMsg(data);
		var defaultValue = errorMsg ? '' : '-';
		var type = escapeHtml(res.headers ? (res.headers['content-type'] || '') : defaultValue);
		return '<tr id="' + data.id + '" class="' + (data.endTime ? getClassName(data) : 'pending') 
					+ (data.isHttps ? ' tunnel' : '') + (hasRules(data) ? ' has-rules' : '') + '">\
			        <th class="order" scope="row">' + ++index + '</th>\
			        <td class="result">' + (res.statusCode || errorMsg || '-') + '</td>\
			        <td class="protocol">' + getProtocol(data.url) + '</td>\
			        <td class="method">' + req.method + '</td>\
			        <td class="host">' + getHostname(data.url) + '</td>\
			        <td class="host-ip">' + (res.ip || defaultValue) + '</td>\
			        <td class="url" title="' + url + '">' + url + '</td>\
			        <td class="type" title="' + type + '">' + type + '</td>\
			        <td class="time">' + (data.endTime ? data.endTime - data.startTime + 'ms' : defaultValue) + '</td>\
			     </tr>';
	}
	
	function hasRules(data) {
		
		return Object.keys(data.rules || {}).length
	}
	
	function updateElement(elem, data) {
		var res = data.res;
		var errorMsg = getErrorMsg(data);
		var defaultValue = errorMsg ? '' : '-';
		var type = res.headers ? (res.headers['content-type'] || '') : defaultValue
		
		elem.find('.result').text(res.statusCode || getErrorMsg(data) || '-');
		elem.find('.host-ip').text(res.ip || defaultValue);
		elem.find('.type').text(type).attr('title', type);
		elem.find('.time').text(data.endTime ? data.endTime - data.startTime + 'ms' : defaultValue);
		elem.addClass(getClassName(data));
		if (data.endTime) {
			elem.removeClass('pending');
		}
	}
	
	function getErrorMsg(data) {
		if (data.reqError) {
			return 'aborted';
		}
		
		if (data.resError) {
			return 'error';
		}
	}
	
	function getHostname(url) {
		var start = url.indexOf(':\/\/');
		if (start == -1) {
			return 'Tunnel to';
		}
		var end = url.indexOf('\/', start += 3);
		return end == -1 ? url.substring(start) : url.substring(start, end);
	}
	
	function getProtocol(url) {
		return url.substring(0, url.indexOf(':\/\/')).toUpperCase() || 'HTTPS';
	}
	
	function getClassName(data) {
		if (data.reqError || data.resError) {
			return 'danger error-status';
		}
		
		if (data.res.statusCode == 403) {
			return 'forbidden';
		}
		
		if (data.res.statusCode >= 400) {
			return 'error-status';
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
	
	function search(scrollToBottom) {
		var rows = body.find('tr');
		var keywords = $.trim(quickSearch.val());
		if (!keywords) {
			rows.show();
			scrollToBottom && container.scrollTop(body[0].offsetHeight);
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
		var encryptHttps = $('#encryptHttps').click(function() {
			$('.add-intercept-rule').trigger('click', selectedData.url.split(':')[0]);
		});
		
		$('#clearAll').click(function() {
			body.html('');
			data = {};
			ids = [];
			index = 0;
			selectedElement = null;
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
			
			selectedData.req.method == 'CONNECT' ? encryptHttps.css('display', 'inline-block') : encryptHttps.hide();
			captureDetail.show().focus();
			resizeDetail();
			var activeElem = captureDetailTabs.filter('.active');
			if (!activeElem.length) {
				activeElem = captureDetailTabs.filter('.overview');
			}
			activeElem.trigger('click', {force: true});
		}).on('click', 'tr', function(e) {
			var self = $(this);
			var that = this;
			
			if (e.shiftKey && selectedElement && selectedElement.parent().length && that != selectedElement[0]) {
				var matched, selected;
				body.find('tr').each(function() {
					if (matched = this == that || this == selectedElement[0]) {
						selected = !selected;
						$(this).addClass('selected');
					} else if (selected) {
						$(this).addClass('selected');
					} else {
						$(this).removeClass('selected');
					}
				});
			} else {
				!e.ctrlKey && !e.metaKey && body.find('tr').removeClass('selected');
				selectedElement = self.addClass('selected');
			}
		});
		
		function resizeDetail() {
			captureDetail.css('height', container[0].offsetHeight - 6);
			captureDetailContent.find('>div,>textarea').height(captureDetailContent[0].offsetHeight / 2);
		}
		
		var docBody = $(document.body);
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
					prev.trigger('click');
					ensureVisible(prev);
				}
				e.preventDefault();
			}
		}).on('keyup', function(e) {
			if (e.keyCode == 27 && !docBody.find('.modal:visible:first').length) {
				captureDetail.hide();
			}
			
			if (isEditable(e.target)) {
				return;
			}
			if (e.keyCode == 13) {
				body.find('tr.selected:last').trigger('dblclick');
			}
		}).on('keydown', function(e) {
			if ((!e.ctrlKey && !e.metaKey) || e.keyCode != 88 
					|| /^TEXTAREA|INPUT$/.test(e.target.nodeName)
					|| docBody.find('.modal:visible:first').length) {
				return;
			}
			
			$('#clearAll').trigger('click');
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
		
		var top = container.offset().top;
		function ensureVisible(tr) {
			var _top = tr.offset().top - top;
			if (_top < 0) {
				container.scrollTop(container.scrollTop() + _top);
				return;
			}
			
			_top += tr[0].offsetHeight - container[0].offsetHeight;
			if (_top > 0) {
				container.scrollTop(container.scrollTop() + _top);
			}
		}
		
		captureDetail.attr('tabIndex', 1)
		.on('click', '.close', function() {
			captureDetail.hide();
		}).on('keydown', function(e) {
			if (e.ctrlKey && e.keyCode == 88) {
				e.stopPropagation();
			}
		});
		
		captureDetail.on('click', '.replay', function() {
			var selectedData = getSelectedData();
			request({
					url: (selectedData.isHttps ? 'https://' : '') + selectedData.url,
					method: selectedData.req.method,
					headers: JSON.stringify(selectedData.req.headers),
					body: selectedData.req.body || null
				});
		}).on('click', '.composer', function() {
			var selectedData = getSelectedData();
			if (!selectedData) {
				return;
			}
			
			$('#composerUrl').val((selectedData.isHttps ? 'https://' : '') + selectedData.url);
			$('#composerHeaders').val(JSON.stringify(selectedData.req.headers, null, '\t'));
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
				var selectedData = getSelectedData();
				var req = selectedData.req;
				var res = selectedData.res;
				var realUrl = selectedData.realUrl;
				if (!realUrl || realUrl == selectedData.url) {
					realUrl = '';
				}
				
				if (self.hasClass('overview')) {
					body.hide();
					textarea.hide();
					var rules = selectedData.rules || {};
					headers.html(getProperties(realUrl ? {
						Url: selectedData.url,
						'Real Url': realUrl,
						Date: new Date(selectedData.startTime).toString(),
						Method: req.method,
						'Status Code': res.statusCode,
						'Host IP': res.ip,
						'Client IP': req.ip,
						'Request Length': req.size == null ? '' : req.size,
						'Content Length': res.size == null ? '' : res.size,
						'Start Time': selectedData.startTime,
						'DNS Lookup': selectedData.dnsTime - selectedData.startTime + 'ms',
						'Request Sent': selectedData.requestTime  && (selectedData.requestTime - selectedData.startTime + 'ms'),
						'Content Download': selectedData.endTime &&  (selectedData.endTime - selectedData.startTime + 'ms')
					} : {
						Url: selectedData.url,
						Date: new Date(selectedData.startTime).toString(),
						Method: req.method,
						'Status Code': res.statusCode,
						'Host IP': res.ip,
						'Client IP': req.ip,
						'Request Length': req.size == null ? '' : req.size,
						'Content Length': res.size == null ? '' : res.size,
						'Start Time': selectedData.startTime,
						'DNS Lookup': selectedData.dnsTime - selectedData.startTime + 'ms',
						'Request Sent': selectedData.requestTime  && (selectedData.requestTime - selectedData.startTime + 'ms'),
						'Content Download': selectedData.endTime &&  (selectedData.endTime - selectedData.startTime + 'ms')
					}) + '<hr/>' + getProperties({
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
			var elems = body.find('tr.selected:visible');
			if (!elems.length) {
				alert('请至少选择一条数据，windows按住 `Ctrl`键，mac按住 `Command`键，可以进行多选。');
				return;
			}
			var list = [];
			var startTime, endTime;
			elems.each(function() {
				var curData = data[this.id];
				if (!startTime || startTime > curData.startTime) {
					startTime = curData.startTime;
				}
				if (curData.endTime && (!endTime || endTime < curData.endTime)) {
					endTime = curData.endTime;
				}
				
				list.push(curData);
			});
			var total = endTime - startTime || 1;
			
			$.each(list, function(i) {
				var end = this.endTime ? this.endTime - this.startTime : 0;
				list[i] = getTimeline({
						order: i + 1,
						className: resolveClassName(elems[i].className),
						url: this.url,
						startTime: this.startTime,
						endTime: this.endTime,
						statusCode: this.res.statusCode || getErrorMsg(this) || '-',
						stalled: this.startTime - startTime,
						dns: this.dnsTime - this.startTime,
						request: this.requestTime ? this.requestTime - this.startTime : end,
						response: this.responseTime ? this.responseTime - this.startTime : end,
						end: end,
						total: total
					});
			});
			
			$('#timelineList').html(list.join(''));
			$('.timeline-dialog').modal();
		});
		
		function getTimeline(data) {
			var url = escapeHtml(data.url);
			
			return '<tr class="' + data.className + '" ' + (data.endTime ?  'title="' 
					+ 'Stalled: ' + data.stalled + 'ms\r\nDNS: ' 
					+ data.dns + 'ms\r\nRequest: ' + (data.request - data.dns) + 'ms\r\Response: ' 
					+ (data.end - data.request) + 'ms"' : '') + '>\
	          <th class="order" scope="row">' + data.order + '</th>\
	          <td class="result">' + data.statusCode + '</td>\
	          <td class="url" title="' + url + '">' + url + '</td>\
	          <td class="timeline" ' + (data.endTime ? ('style="background-image: -webkit-gradient(linear, left top, right top, color-stop(0, rgba(0, 0, 0, 0)), color-stop('
	        		   + data.stalled / data.total + ', rgba(0, 0, 0, 0)), color-stop(' 
	        		   + data.stalled / data.total + ', #fec2ba), color-stop(' 
	        		   + (data.dns + data.stalled) / data.total + ', #fec2ba), color-stop(' 
	        		   + (data.dns + data.stalled) / data.total + ', #e58226), color-stop(' 
	        		   + (data.request + data.stalled) / data.total + ', #e58226), color-stop(' 
	        		   + (data.request + data.stalled) / data.total + ', #5fee5f), color-stop(' 
	        		   + (data.end + data.stalled) / data.total + ', #5fee5f), color-stop(' 
	        		   + (data.end + data.stalled) / data.total + ', rgba(0, 0, 0, 0)), color-stop(1, rgba(0, 0, 0, 0)));"') : '') + '>' 
	          + (data.endTime ? data.endTime - data.startTime + 'ms' : '-') + '</td>\
	        </tr>';
		}
		
		function resolveClassName(className) {
		
			return /\b(tunnel|warning|info|success|active|danger)\b/.test(className) ? RegExp.$1 : '';
		}
		
	}
	
	function request(data) {
		$.ajax({
			url: '/cgi-bin/composer/request',
			method: 'POST',
			data: data
		});
		container.scrollTop(body[0].offsetHeight);
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