# ignore
忽略(过滤)指定的规则设置，配置模式(v1.2.5及以上版本支持)：

	pattern ignore://protocol1|protocol2|protocolN

其中，`protocol1`，...，`protocolN`对应[协议列表](../rules/)里面的协议，`|`为分隔符用于同时设置忽略(过滤)多个规则。

例子：

	#　忽略socks协议及指定插件
	www.baidu.com socks://127.0.0.1:1080 whistle.test://xxx
	www.baidu.com ignore://socks|whistle.test

	#　忽略proxy协议及指定插件
	/google/ proxy://127.0.0.1:8888 implugin://xxx
	www.google.com enable://intercept
	www.google.com ignore://proxy|implugin|enable

	#　忽略配置的host
	www.qq.com 127.0.0.1
	www.qq.com ignore://host