# log

可以用来自动监控html页面或js文件出现的错误及显示console.xxx打印出来的信息，这些错误及日志会自动打印在whistle界面的log平台，还可以自动嵌入自定义的脚本调试页面。

支持的console方法有(支持所有浏览器)： console.log, console.debug, console.info, console.warn. console.error, console.fatal。

配置方式：

	pattern log://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件的js脚本(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com log://{test.js}

[Values](http://local.whistlejs.com/#values)里面的`test.js`分组内容：

	console.log(1, 2, 3, {abc: 123});
