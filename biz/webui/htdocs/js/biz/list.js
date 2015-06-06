define('/style/js/biz/list.js', function(require, exports, module) {
	var body = $('#captureListBody');
	var	MAX_COUNT = 512;
	var ids = [];
	var data = {};
	var index = 0;
	var pending;
	
	var AMP    = /&/g,
	    LT     = /</g,
	    GT     = />/g,
	    QUOT   = /\"/g,
	    SQUOT  = /\'/g;
	
	function escapeHtml(s) {
	    return typeof s === 'string' ? s.replace(AMP,'&amp;').replace(LT,'&lt;').replace(GT,'&gt;')
	  	      .replace(QUOT,'&quot;').replace(SQUOT, '&#39;') : s;
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
				setTimeout(load, 1600);
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
		var startTime = ids.length <= MAX_COUNT ? id : -1;
		
		function _load() {
			pending = false;
			getList({
				ids: pendingIds.join(),
				startTime: startTime
			});
		}
		
		if (startTime == -1 && !pendingIds.length) {
			setTimeout(_load, 5000);
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
		if (list.length >= MAX_COUNT) {
			return;
		}
		
		list.filter('.pending').each(function() {
			var self = $(this);
			var curData = data[self.attr('id')];
			curData && updateElement(self, curData);
		});
		
		var last = list.filter(':last');
		var lastId = last.attr('id');
		lastId = lastId && (lastId = $.inArray(lastId, ids)) != -1 ? lastId : 0;
		var html = [];
		for (len = ids.length; lastId < len; lastId++) {
			html.push(getHtml(data[ids[lastId]]));
		}
		body.append(html.join(''));
	}
	
	function getHtml(data) {
		if (!data) {
			return '';
		}
		var res = data.res;
		var req = data.req;
		var defaultValue = data.reqError || data.resError ? 'error' : '-';
		
		return '<tr id="' + data.id + '" class="' + (data.endTime ? getClassname(data) : 'pending') + '">\
			        <th class="order" scope="row">' + ++index + '</th>\
			        <td class="result">' + (res.statusCode || defaultValue) + '</td>\
			        <td class="protocol">' + getProtocol(data.url) + '</td>\
			        <td class="method">' + req.method + '</td>\
			        <td class="host">' + getHostname(data.url) + '</td>\
			        <td class="host-ip">' + (res.host || defaultValue) + '</td>\
			        <td class="url" title="' + escapeHtml(data.url) + '">' + escapeHtml(data.url) + '</td>\
			        <td class="type">' + (res.headers && res.headers['content-type'] || defaultValue) + '</td>\
			        <td class="time">' + (data.endTime ? data.endTime - data.startTime : defaultValue) + '</td>\
			     </tr>';
	}
	
	function updateElement(elem, data) {
		var res = data.res;
		var defaultValue = data.reqError || data.resError ? 'error' : '-';
		elem.find('.result').text(res.statusCode || defaultValue);
		elem.find('.host-ip').text(res.host || defaultValue);
		elem.find('.type').text((res.headers && res.headers['content-type'] || defaultValue));
		elem.find('.time').text(data.endTime ? data.endTime - data.startTime : defaultValue);
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
		if (data.reqError || data.resError) {
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
		var index = $.inArray(elems.id, ids);
		if (index != -1) {
			ids.splice(index, 1);
		}
		elems.remove();
	}
	
	module.exports = function init() {
		getList();
		$('#clearAll').click(function() {
			body.html('');
			data = {};
			ids = [];
		});
	};
});