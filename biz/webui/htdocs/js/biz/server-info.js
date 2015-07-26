define('/style/js/biz/server-info.js', function(require, exports, module) {
	var whistle = window.whistle = {};
	var curServerInfo;
	var serverStateDialog = $('.server-disconnected-dialog');
	
	var post = $.post;
	$.post = function() {
		if (whistle.disconnected) {
			serverStateDialog.modal('show');
		}
		post.apply($, arguments);
	};
	
	$(document.body).on('click', '.reload', function() {
		location.reload();
	});
	
	function getServerInfo() {
		$.ajax({
			url: '/cgi-bin/server-info',
			dataType: 'json',
			timeout: 10000,
			success: handleServerInfo,
			error: showDisconnectedDialog,
			complete: function() {
				setTimeout(getServerInfo, 2000);
			}
		});
	}
	
	function handleServerInfo(data) {
		data = data.server;
		hideDisconnectedDialog();
		checkServerInfo(data) ? hideServerChangedDialog() : showServerChangedDialog(data);
	}
	
	function checkServerInfo(newServerInfo, serverInfo) {
		serverInfo = serverInfo || whistle.serverInfo;
		
		return !(serverInfo.port != newServerInfo.port || serverInfo.host != newServerInfo.host || 
				serverInfo.ipv4.sort().join() != newServerInfo.ipv4.sort().join() || 
				serverInfo.ipv6.sort().join() != newServerInfo.ipv6.sort().join());
	}
	
	function renderAboutDialog(serverInfo) {
		var html = ['<label>Host: </label> ' + serverInfo.host, '<label>Port: </label> ' + serverInfo.port];
		if (serverInfo.ipv4.length) {
			html.push('<label>IPv4:</label><br>' + serverInfo.ipv4.join('<br>'));
		}
		if (serverInfo.ipv6.length) {
			html.push('<label>IPv6:</label><br>' + serverInfo.ipv6.join('<br>'));
		}
		$('.about-server-info').html(html.join('<br>'));
	}
	
	function showDisconnectedDialog() {
		curServerInfo = null;
		if (whistle.disconnected) {
			return;
		}
		hideServerChangedDialog();
		whistle.disconnected = true;
		$('.server-disconnected-dialog').modal('show');
	}
	
	function hideDisconnectedDialog() {
		whistle.disconnected = false;
		$('.server-disconnected-dialog').modal('hide');
	}
	
	function showServerChangedDialog(serverInfo) {
		if (checkServerInfo(serverInfo, curServerInfo)) {
			return;
		}
		curServerInfo = serverInfo;
		hideDisconnectedDialog();
		$('.server-changed-dialog').modal('show');
		renderAboutDialog(serverInfo);
	}
	
	function hideServerChangedDialog() {
		$('.server-changed-dialog').modal('hide');
	}
	
	module.exports = function init(serverInfo) {
		whistle.serverInfo = serverInfo;
		renderAboutDialog(serverInfo);
		setTimeout(getServerInfo, 1000);
	};
});
