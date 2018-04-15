# proxy

设置http代理，配置方式：

	pattern proxy://ip:port

	# 加用户名密码
	pattern proxy://username:password@ip:port

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。


例子：

把所有请求代理到`127.0.0.1:8888`的代理服务器：

	/./ proxy://127.0.0.1:8888
	www.facebook.com proxy://test:123@127.0.0.1:8888
