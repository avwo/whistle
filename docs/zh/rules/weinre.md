# weinre

weinre 可以用于调试远程页面特别是移动端的网页，配置模式：

	pattern weinre://key

key 为任意的字符串，主要用于区分页面，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

如何使用 weinre：

1. 配置手机代理：先把手机的请求代理到 whistle，ip 为 whistle 所在机器的 ip，端口号为 whistle 的监听的端口号 (默认为：8899)
配置要注入的请求 (系统会自动判断是否为 html，如果不是则不会自动注入)：

		# xxx 为对应的 weinre id，主要用于页面分类，默认为 anonymous
		www.example.com weinre://xxx
2. 手机打开配置的页面，然后点击 network 页面顶部操作栏的 Weinre 按钮，在下拉列表就可以找到设置的 weinre id 的，点击会新开一个 weinre 调试页面，可以开始使用 weinre

3. 手机调试或者远程访问时，可能会因为 whistle 所在机器的防火墙设置，导致无法远程访问，可以通过设置白名单，或者关闭防火墙：[http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html](http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)
