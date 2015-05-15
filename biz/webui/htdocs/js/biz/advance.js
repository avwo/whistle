
define('/style/js/biz/advance.js', function(require, exports, module) {
	
	function addEvents() {
		$('#advanceSearch').click(function() {
			$.ajax({
				url: '/cgi-bin/advance/search',
				dataType: 'json',
				type: 'POST',
				data: {
						keyword: $.trim($('#advanceKeyword').val()),
						startDate: $.trim($('#advanceStartDate').val()) + ' ' + $('#advanceStartTime').val(),
						endDate: $.trim($('#advanceEndDate').val()) + ' ' + $('#advanceEndTime').val()
					}
			});
			$('#advanceBtn').addClass('active');
			$('.advance-dialog').modal('hide');
		});
		
		$('#cancelSearch').click(function(e) {
			$('#advanceBtn').removeClass('active');
			e.stopPropagation();
		});
	}
	
	module.exports = function init() {
		var format = {format: 'yyyy-dd-mm'};
		$('#advanceStartDate').datepicker(format);
		$('#advanceEndDate').datepicker(format);
		addEvents();
	};
});