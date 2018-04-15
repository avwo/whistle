# enable

通过配置开启指定的设置(https 拦截、隐藏请求)，配置模式(v1.2.5 及以上版本支持)：

	pattern enable://https|intercept|hide|abort

其中，`https` 或 `intercept` 表示拦截 pattern 匹配的 tunnel 请求 (如果是 https 或 wss 请求需要安装 whistle 的根证书：[点击这里](webui/https.md)，拦截后可以查看 https 请求的具体内容)；`hide` 表示隐藏 pattern 匹配的所有请求，将不显示在[Network](webui/network.md) 上；通过 `|` 可以同时设置多个操作。

例子：

	# 拦截 url 里面有 baidu 的 https 请求
	/baidu/ enable://intercept

	# 拦截域名 www.google.com 下的所有 https 请求，且不在 Network 上显示
	www.google.com enable://intercept|hide

	# abort 掉请求(v1.5.17+)
	www.xiaoying.com enable://abort
