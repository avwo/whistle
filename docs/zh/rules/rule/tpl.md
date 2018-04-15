# tpl (xtpl)

__xtpl 功能同 tpl 一样，和 tpl 的唯一区别是 tpl 找不到对应文件返回 404，而 xtpl 则是继续请求线上资源。__


tpl 基本功能跟 [file](rules/rule/file.md) 一样可以做本地替换，但 tpl 内置了一个简单的模板引擎，可以把文件内容里面 `{name}` 替换请求参数对应的字段(如果不存在对应的自动则不会进行替换)，一般可用于 mock jsonp 的请求。

配置模式：

	pattern tpl://filepath
	# 也可以匹配一个文件或目录路径列表，whistle 会依次查找直到找到存在的文件
	pattern tpl://path1|path2|pathN

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件。


例子：

		/\.jsonp/i  tpl://{test.json}

test.json:

		{callback}({ec: 0})

请求 `http://www.test.com/test/xxx.jsonp?callback=imcallbackfn` 会返回 `imcallbackfn({ec: 0})`
