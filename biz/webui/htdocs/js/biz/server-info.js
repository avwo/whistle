define('/style/js/biz/server-info.js', function(require, exports, module) {
	var errorCount = 0;
	var whistle = window.whistle = {};
	
	function getServerInfo() {
		$.ajax({
			url: '/cgi-bin/server-info',
			dataType: 'json',
			timeout: 10000,
			success: handleServerInfo,
			error: handleError,
			complete: function() {
				setTimeout(getServerInfo, 1000);
			}
		});
	}
	
	function handleServerInfo(data) {
		data = data.server;
		hideDisconnectedDialog();
		
	}
	
	function handleError() {
		if (!whistle.disconnected && ++errorCount > 2) {
			errorCount = 0;
			showDisconnectedDialog();
		}
	}
	
	function checkServerInfo(newServerInfo) {
		
	}
	
	function renderAboutDialog(serverInfo) {
		var html = ['<label>Host: </label> ' + serverInfo.host];
		if (serverInfo.ipv4.length) {
			html.push('<label>IPv4:</label><br>' + serverInfo.ipv4.join('<br>'));
		}
		if (serverInfo.ipv6.length) {
			html.push('<label>IPv6:</label><br>' + serverInfo.ipv6.join('<br>'));
		}
		
		$('.about-server-dialog').find('.modal-body').html(html.join('<br>'));
	}
	
	function showDisconnectedDialog() {
		whistle.disconnected = true;
	}
	
	function hideDisconnectedDialog() {
		whistle.disconnected = false;
		errorCount = 0;
	}
	
	function showServerChangedDialog() {
		
	}
	
	function hideServerChangedDialog() {
		
	}
	
	module.exports = function init(serverInfo) {
		whistle.serverInfo = serverInfo;
		renderAboutDialog(serverInfo);
	};
});
