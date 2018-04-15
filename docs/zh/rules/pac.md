
# pac
设置pac脚本，配置方式：

	pattern pac://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)或http(s)链接，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：


	/./ pac://https://raw.githubusercontent.com/imweb/node-pac/master/test/scripts/normal.pac