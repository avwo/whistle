# rulesFile(ruleFile, rulesScript, ruleScript)

> 该协议 `v1.7.0` 开始已经废弃，请使用 [reqScript](rules/reqScript.md) 代替

给匹配的请求批量设置规则，或者通过脚本动态设置规则，配置模式：

	pattern rulesFile://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地 js 文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

filepath 指定的文本可以为一组规则列表，也可以一个 js 脚本通过判断 url、method、clientIp、headers, body 动态设置规则：

### 静态规则列表
whistle 判断如果文件的第一行为规则的注释，即 `#` 开头，则任务 filepath 指定的是规则列表，会加载该列表，并进行二次匹配获取规则：

	# rules
	pattern1 operator-uri1
	pattern2 operator-uri2
	patternN operator-uriN

### 通过脚本动态设置规则
rulesFile 可以指定一个脚本，whistle 在执行脚本时会自动在全局传人：

1. `url`: 请求的完整路径
2. `method`: 请求方法
3. `ip`: 客户端 ip
4. `headers`: 请求头部
5. `body`: 请求内容，如果没有请求内容为空字符串(`''`)，如果请求内容大于 16k，可能只能获取请求前面 16k 长度的内容(whistle >= v1.5.18)
6. `rules`: 存放新规则的数组
7. `values`: 存放临时 values 的对象(v1.6.7 开始支持)
8. `render(tplStr, data)`: 内置[microTemplate](https://johnresig.com/blog/javascript-micro-templating/)，方便通过模板渲染数据(v1.6.7 开始支持)
9. `getValue(key)`: 获取 Values 中对应 key 的值(v1.6.7 开始支持)
10. `parseUrl`: 同 `url.parse`(v1.6.7 开始支持)
11. `parseQuery`: 同 `querystring.parse`(v1.6.7 开始支持)


用该方法可以解决此问题[#19](https://github.com/avwo/whistle/issues/19)，也可以用来做 ip_hash 等，具体用法看下面的例子


例子：

设置静态规则列表

	www.ifeng.com rulesFile://{rulesFile.txt}

rulesFile.txt:

	# 第一行没有这个注释符号，whistle 会认为是一个脚本
	http://www.ifeng.com/index.html redirect://http://www.ifeng.com/?test
	www.ifeng.com resType://text

通过脚本设置规则列表

	www.ifeng.com rulesFile://{rulesFile.js}

rulesFile.js:

	if (/index\.html/i.test(url)) {
		rules.push('/./ redirect://http://www.ifeng.com/?test.js');
	}

	if (/html/.test(headers.accept)) {
		rules.push('/./ resType://text');
	}
	// 如果请求内容里面有 prefix 字段，则作为新 url 的前缀
	if (/(?:^|&)prefix=([^&]+)/.test(body)) {
		var prefix = RegExp.$1;
		var index = url.indexOf('://') + 3;
		var schema = url.substring(0, index);
		var newUrl = schema + prefix + '.' + url.substring(index);
		rules.push(url + ' ' + newUrl);
		// rules.push('/./' + newUrl);
	}
