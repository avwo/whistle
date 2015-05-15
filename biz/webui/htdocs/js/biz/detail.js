define('/style/js/biz/detail.js', function(require, exports, module) {
	var captureDetail = $('#captureDetail');
	
	captureDetail.on('click', '.close', function() {
		captureDetail.hide();
	});
	
	$(window).on('keydown', function(e) {
		if (e.keyCode == 27) {
			captureDetail.hide();
		}
	});
	
	exports.show = function(req) {
		captureDetail.show();
	};
});