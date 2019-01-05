# rawfile

替换本地(目录下)的http格式的文件(可以与[resWriteRaw](resWriteRaw.html)配合使用)，请求会自动补全路径，配置方式：

	pattern rawfile://filepath
	# 也可以匹配一个文件或目录路径列表，whistle会依次查找直到找到存在的文件
	pattern rawfile://path1|path2|pathN

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件，pattern参见[匹配模式](../../pattern.html)，更多模式请参考[配置方式](../../mode.html)。

http格式文件参考: [http内容格式](http://www.cnblogs.com/kissdodog/archive/2013/01/11/2856335.html)

例子:

	www.ifeng.com rawfile://{test-rawfile}

[Values](http://local.whistlejs.com/#values)中的分组`test-rawfile`:

	HTTP/1.1 200 OK
	content-type: text/plain

	test
