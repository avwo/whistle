
define('/style/js/biz/advance.js', function(require, exports, module) {
	var list = require('./list');
	var ONE_HOUR = 1000 * 60 * 60;
	var ONE_DAY = ONE_HOUR *24;
	
	function getTime(date, time) {
		if (/^\d{4}(-\d\d?){2}/.test(date)) {
			date = date.split('-');
			date = new Date(parseInt(date[0], 10), 
					parseInt(date[1], 10) - 1, 
					parseInt(date[2], 10)).getTime();
		} else {
			date = new Date().getTime();
			date = Math.floor(date / ONE_DAY) * ONE_DAY;
		}
		
		if (time = parseInt(time, 10) || 0) {
			date += time * ONE_HOUR;
		}
		
		return date;
	}
	
	function addEvents() {
		$('#advanceSearch').click(function() {
			
			list.getList({
				keyword: $.trim($('#advanceKeyword').val()),
				startDate: getTime($('#advanceStartDate').val(), $('#advanceStartTime').val()),
				endDate: getTime($('#advanceEndDate').val(), $('#advanceEndTime').val())
			}).done(function(data) {
				
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
		var format = {format: 'yyyy-mm-dd'};
		$('#advanceStartDate').datepicker(format);
		$('#advanceEndDate').datepicker(format);
		addEvents();
	};
});