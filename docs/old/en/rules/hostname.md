# hostname
修改请求头的host字段，后台server会根据请求头的host字段来判断请的域名，一般情况下无需修改采用默认的即可，但在调试阶段可能会涉及到host里面有端口的问题，则可以用hostname这个协议来去除端口(最好的方式还是采用配置带端口号的[host](host.html))。

配置方式:

	pattern hostname://newHostname

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.test.com:8888 hostname://www.test.com

去掉www.test.com:8888所有请求头部host字段的端口号。
