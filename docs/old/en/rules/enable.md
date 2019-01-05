# enable
通过配置开启指定的设置(https拦截、隐藏请求)，配置方式(v1.2.5及以上版本支持)：

	pattern enable://https|intercept|hide|abort

其中，`https`或`intercept`表示拦截pattern匹配的tunnel请求(如果是https或wss请求需要安装whistle的根证书：[点击这里](../webui/https.html)，拦截后可以查看https请求的具体内容)；`hide`表示隐藏pattern匹配的所有请求，将不显示在[Network](../webui/network.html)上；通过`|`可以同时设置多个操作。

例子：

	# 拦截url里面有baidu的https请求
	/baidu/ enable://intercept

	# 拦截域名www.google.com下的所有https请求，且不在Network上显示
	www.google.com enable://intercept|hide

	# abort掉请求(v1.5.17+)
	www.xiaoying.com enable://abort
