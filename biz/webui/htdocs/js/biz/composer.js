define('/style/js/biz/composer.js', function(require, exports, module) {
	
	
	
	module.exports = function init() {
		$('#executeComposer').click(function() {
			var url = $.trim($('#composerUrl').val());
			if (!url) {
				alert('url不能为空');
				return;
			}
			$.ajax({
				url: '/cgi-bin/composer/request',
				method: 'POST',
				data: {
					url: url,
					method: $('#composerMethod').val(),
					headers: $('#composerHeaders').val(),
					body: $('#composerBody').val()
				}
			});
			$('.composer-dialog').modal('hide');
		});
	};
});