# 注意事项

1. 没有[开启https拦截][1]的https、websocket的请求或者通过https代理过来的socket请求，由于无法获取代理内容的协议或者本身代理内容没有协议，方便配置时区分，whistle把这些请求的协议看成`tunnel:`，所以这里请求只能支持[域名匹配、正则匹配](pattern.html)和形如下面的路径匹配：

		tunnel://host operatorURI
		tunnel://host/ operatorURI
		tunnel://host:port operatorURI
		tunnel://host:port/ operatorURI
2. https代理也可以代理socket请求，前提对该请求不能[开启https拦截][1]，可以在代理头部新增`x-whistle-policy: tunnel`，这时whistle对该HTTPS代理的请求不会[开启https拦截][1]，即使whistle本身[开启https拦截][1]。
3. 还有一些遇到过的问题可以查看：[常见问题](questions.html)
4. 用户反馈见：[用户反馈](fallback.html)

[1]: webui/https.html "https拦截"
