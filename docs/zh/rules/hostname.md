# hostname

修改请求头的 host 字段，后台 server 会根据请求头的 host 字段来判断请的域名，一般情况下无需修改采用默认的即可，但在调试阶段可能会涉及到 host 里面有端口的问题，则可以用 hostname 这个协议来去除端口 (最好的方式还是采用配置带端口号的 [host](rules/host.md))。

配置模式:

	pattern hostname://newHostname

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

	www.test.com:8888 hostname://www.test.com

去掉 www.test.com:8888 所有请求头部 host 字段的端口号。
