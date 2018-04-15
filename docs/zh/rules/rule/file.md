# file (xfile)

__xfile 功能同 file 一样，xfile 和 file 的唯一区别是 file 找不到对应文件返回 404，而 xfile 则是继续请求线上资源。__

替换本地目录或文件，配置模式：

	pattern file://filepath
	# 也可以匹配一个文件或目录路径列表，whistle 会依次查找直到找到存在的文件
	pattern file://path1|path2|pathN

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

如果 pattern 为域名或路径，whistle 会自动根据请求 url 后面剩余的路径跟 filepath 自动补全，即：

	www.test.com/abc file://filpath

则请求 `http://www.test.com/abc/index.html` 会替换本地的 `filepath/index.html` 文件，如果不想自动补全可以使用操作符 `<>`：

	www.test.com/abc file://<filepath>

这样所有 `www.test.com/abc` 的子路径都会被 `filepath` 替换掉，这种情况也可以用正则匹配解决。


例子：

	www.ifeng.com file:///User/xxx/test|/User/xxx/test/index.html
	# Windows 的路径分隔符同时支持 \ 和 /
	www.ifeng.com file://D:/xxx/test|D:/xxx/test/index.html
	www.ifeng.com file://D:\xxx\test|D:\xxx\test\index.html

所有 www.ifeng.com 的请求都会先到目录或文件 `/User/xxx/test`，没有匹配的文件再到 `/User/xxx/test/index.html`
