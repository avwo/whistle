# pac

设置 pac 脚本，配置模式：

	pattern pac://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件 (如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等) 或 http(s)链接，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	/./ pac://https://raw.githubusercontent.com/imweb/node-pac/master/test/scripts/normal.pac
