# responseFor

设置响应头的 `x-whistle-response-for` 字段(`whistle >= v1.7.1`)，主要方便自定义whistle的Network SeverIP显示真实的服务器环境或IP，配置方式：

	pattern responseFor://env

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 修改www.ifeng.com请求头的`x-whistle-response-for` 字段为 1.1.1.1
	www.ifeng.com responseFor://1.1.1.1


PS：某些情况下需要通过nigix转发，可以结合[resScript](./resScript.html)把响应头的`x-upstream`字段设置到`x-whistle-response-for`，这样就可以在whistle的Network上看到真实的IP
