# weinre

weinre可以用于调试远程页面特别是移动端的网页，配置方式：

	pattern weinre://key

key为任意的字符串，主要用于区分页面，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

如何使用weinre：

1. 配置手机代理：先把手机的请求代理到whistle，ip为whistle所在机器的ip，端口号为whistle的监听的端口号(默认为：8899)
配置要注入的请求(系统会自动判断是否为html，如果不是则不会自动注入)：

		# xxx为对应的weinre id，主要用于页面分类，默认为anonymous
		www.example.com weinre://xxx
2. 手机打开配置的页面，然后点击 network 页面顶部操作栏的 Weinre 按钮，在下拉列表就可以找到设置的weinre id的，点击会新开一个weinre调试页面，可以开始使用weinre

3. 手机调试或者远程访问时，可能会因为whistle所在机器的防火墙设置，导致无法远程访问，可以通过设置白名单，或者关闭防火墙：[http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html](http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)
