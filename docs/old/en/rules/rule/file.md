
# file (xfile)

__xfile功能同file一样，xfile和file的唯一区别是file找不到对应文件返回404，而xfile则是继续请求线上资源。__

替换本地目录或文件，配置方式：

	pattern file://filepath
	# 也可以匹配一个文件或目录路径列表，whistle会依次查找直到找到存在的文件
	pattern file://path1|path2|pathN

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件，pattern参见[匹配模式](../../pattern.html)，更多模式请参考[配置方式](../../mode.html)。

如果pattern为域名或路径，whistle会自动根据请求url后面剩余的路径跟filepath自动补全，即：

	www.test.com/abc file://filpath

则请求`http://www.test.com/abc/index.html`会替换本地的`filepath/index.html`文件，如果不想自动补全可以使用操作符`<>`：

	www.test.com/abc file://<filepath>

这样所有`www.test.com/abc`的子路径都会被`filepath`替换掉，这种情况也可以用正则匹配解决。


例子：

	www.ifeng.com file:///User/xxx/test|/User/xxx/test/index.html
	# Windows的路径分隔符同时支持\和/
	www.ifeng.com file://D:/xxx/test|D:/xxx/test/index.html
	www.ifeng.com file://D:\xxx\test|D:\xxx\test\index.html

所有www.ifeng.com的请求都会先到目录或文件`/User/xxx/test`，没有匹配的文件再到`/User/xxx/test/index.html`
