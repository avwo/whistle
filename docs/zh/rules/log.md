# log

可以用来自动监控 html 页面或 js 文件出现的错误及显示 console.xxx 打印出来的信息，这些错误及日志会自动打印在 whistle 界面的 log 平台，还可以自动嵌入自定义的脚本调试页面。

支持的 console 方法有(支持所有浏览器)： console.log, console.debug, console.info, console.warn. console.error, console.fatal。

配置模式：

	pattern log://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件的 js 脚本(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com log://{test.js}

[Values](http://local.whistlejs.com/#values)里面的 `test.js` 分组内容：

	console.log(1, 2, 3, {abc: 123});
