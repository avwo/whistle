# params

修改请求参数或表单参数，配置模式：

	pattern params://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	field1: value1
	field2: value2
	filedN: valueN

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

params 的作用分三种情况：

1. 上传表单：用于修改上传表单的内容字段

		pattern params://{text.txt}

	test.txt

		{
		    "name1": "value1",
		    "name2": "value2",
		    "file1": {
		        "filename": "text.txt",
		        "content": "xxxxxxxxxxxxxxx"
		    }
		}

	*whistle 会自动判断，如果是上传表单或 POST 表单提交，则会修改请求内容，如果是 GET 请求，则只修改 url 参数。*

2. POST 表单提交：用于修改 POST 表单的内容字段
3. 其它请求：用于修改请求 url 的参数


例子：

	www.ifeng.com params://(test=123)

括号的写法见：[Rules 的特殊操作符({}、()、<>)](webui/rules.md)
