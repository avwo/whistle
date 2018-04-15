# resCors

修改响应的[cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，配置模式：

	pattern resCors://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	origin: *
	methods: POST
	headers: x-test
	credentials: true
	maxAge: 300000

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

一些特性且常用的情形可以用这种方式配置：

	# `*` 表示设置 access-control-allow-origin: *
	www.example.com resCors://*

	#  `enable` 表示设置 access-control-allow-origin: http://originHost
	# 及 access-control-allow-credentials: true
	# 可用于 script 标签上设置为 `crossorigin=use-credentials` 的情形
	www.example.com resCors://enable
	# 或
	www.example.com resCors://use-credentials

例子：

	www.ifeng.com resCors://{test-resCors.json}


test-resCors.json:

	origin: *
	methods: POST
	headers: x-test
	credentials: true
	maxAge: 300000
