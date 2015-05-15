define('/style/js/biz/actions.js', function(require, exports, module) {
	
	function addEvents() {
		var helpList = $('#helpList').click(function() {
			helpList.hide();
		});
		
		$(document.body).on('click', function(e) {
			var target = $(e.target);
			if (!target.closest('#moreActions').length && !target.closest('#helpList').length) {
				helpList.hide();
			}
		});
		
		$('#moreActions').click(function() {
			helpList.show();
		});
		
		$('#clearAll').click(function() {
			
		});
	}
	
	module.exports = function init() {
		addEvents();
	};
});