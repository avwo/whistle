# rawfile (xrawfile)

__xrawfile 功能同 rawfile 一样，和 rawfile 的唯一区别是 rawfile 找不到对应文件返回 404，而 xrawfile 则是继续请求线上资源。__

替换本地 (目录下) 的 http 格式的文件 (可以与[resWriteRaw](rules/rule/resWriteRaw.md) 配合使用)，请求会自动补全路径，配置模式：

	pattern rawfile://filepath
	# 也可以匹配一个文件或目录路径列表，whistle 会依次查找直到找到存在的文件
	pattern rawfile://path1|path2|pathN

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

http 格式文件参考: [http 内容格式](http://www.cnblogs.com/kissdodog/archive/2013/01/11/2856335.html)

例子:

	www.ifeng.com rawfile://{test-rawfile}

[Values](http://local.whistlejs.com/#values)中的分组 `test-rawfile`:

	HTTP/1.1 200 OK
	content-type: text/plain

	test
