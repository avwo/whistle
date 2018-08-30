# https-proxy

设置https代理（即用https代理协议），配置方式：

	pattern https-proxy://ip:port

	# 加用户名密码
	pattern https-proxy://username:password@ip:port

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。


例子：

把所有请求代理到`127.0.0.1:8888`的代理服务器：

	/./ https-proxy://127.0.0.1:8888
	www.facebook.com https-proxy://test:123@127.0.0.1:8888
