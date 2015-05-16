define('/style/js/biz/list.js', function(require, exports, module) {
	
	exports = module.exports = function init() {
		
	};
	
	exports.getList = function getList(data) {
		return $.ajax({
			url: '/cgi-bin/list/get-urls',
			dataType: 'json',
			cache: false,
			data: data
		});
	};
	
	exports.getHeaders = function getHeaders(ids) {
		
	};
	
	exports.getReq = function getReq(id) {
		
	};
	
	exports.getRes = function getRes(id) {
		
	};
	
});