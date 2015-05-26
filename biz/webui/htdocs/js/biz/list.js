define('/style/js/biz/list.js', function(require, exports, module) {
	var captureListBody = $('#captureListBody');
	var xhr;
	var	MAX_COUNT = 360;
	var urls = [];
	var headers = {};
	var bodies = {};
	
	function getList(options) {
		
		xhr = $.ajax({
			url: '/cgi-bin/list/get-urls',
			dataType: 'json',
			timeout: 10000,
			cache: false,
			data: options,
			success: handleData,
			complete: function() {
			}
		});
		
		return xhr;
	}
	
	function handleData(data) {
		for (var i = 0, len = data && data.length; i < len; i++) {
			var line = data[i].split(' ');
			urls.push({
				id: line[0],
				method: line[1],
				versiont: line[2],
				url: line[3],
				host: line[4],
				headers: parseJSON(line.slice(5).join(' '))
			});
		}
	}

	function parseJSON(str) {
		try {
			return $.parseJSON(str) || {};
		} catch(e) {}
		
		return {};
	}
	
	function getHeaders(ids) {
		
	}
	
	function getReq(id) {
		
	}
	
	function getRes(id) {
		
	}
	
	function clear() {
		
	}
	
	module.exports = function init(options) {
		xhr && xhr.abort();
//		captureListBody.html('');
		getList(options);
	};
	
});