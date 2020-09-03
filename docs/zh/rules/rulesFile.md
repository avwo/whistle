# rulesFile(ruleFile, rulesScript, ruleScript)

> 该协议 `v1.7.0` 开始已经废弃，请使用[reqScript](./reqScript.html)代替

给匹配的请求批量设置规则，或者通过脚本动态设置规则，配置方式：

	pattern rulesFile://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地js文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

filepath指定的文本可以为一组规则列表，也可以一个js脚本通过判断url、method、clientIp、headers, body动态设置规则：

### 静态规则列表
whistle判断如果文件的第一行为规则的注释，即`#`开头，则任务filepath指定的是规则列表，会加载该列表，并进行二次匹配获取规则：

	# rules
	pattern1 operatorURI1
	pattern2 operatorURI2
	patternN operatorURIN

### 通过脚本动态设置规则
rulesFile可以指定一个脚本，whistle在执行脚本时会自动在全局传人：

1. `url`: 请求的完整路径
2. `method`: 请求方法
3. `ip`: 客户端ip
4. `headers`: 请求头部
5. `body`: 请求内容，如果没有请求内容为空字符串(`''`)，如果请求内容大于16k，可能只能获取请求前面16k长度的内容(whistle >= v1.5.18)
6. `rules`: 存放新规则的数组
7. `values`: 存放临时values的对象(v1.6.7开始支持)
8. `render(tplStr, data)`: 内置[microTemplate](https://johnresig.com/blog/javascript-micro-templating/)，方便通过模板渲染数据(v1.6.7开始支持)
9. `getValue(key)`: 获取Values中对应key的值(v1.6.7开始支持)
10. `parseUrl`: 同 `url.parse`(v1.6.7开始支持)
11. `parseQuery`: 同 `querystring.parse`(v1.6.7开始支持)


用该方法可以解决此问题[#19](https://github.com/avwo/whistle/issues/19)，也可以用来做ip_hash等，具体用法看下面的例子


例子：

设置静态规则列表

	www.ifeng.com rulesFile://{rulesFile.txt}

rulesFile.txt:

	# 第一行没有这个注释符号，whistle会认为是一个脚本
	http://www.ifeng.com/index.html redirect://http://www.ifeng.com/?test
	www.ifeng.com resType://text

通过脚本设置规则列表

	www.ifeng.com rulesFile://{rulesFile.js}

rulesFile.js:

	if (/index\.html/i.test(url)) {
		rules.push('* redirect://http://www.ifeng.com/?test.js');
	}

	if (/html/.test(headers.accept)) {
		rules.push('* resType://text');
	}
	// 如果请求内容里面有prefix字段，则作为新url的前缀
	if (/(?:^|&)prefix=([^&]+)/.test(body)) {
		var prefix = RegExp.$1;
		var index = url.indexOf('://') + 3;
		var schema = url.substring(0, index);
		var newUrl = schema + prefix + '.' + url.substring(index);
		rules.push(url + ' ' + newUrl);
		// rules.push('* ' + newUrl);
	}

	#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](./ignore.html)：忽略指定规则
2. [filter](./filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

例子：

```
# 下面表示匹配pattern的同时不能为post请求且请求头里面的cookie字段必须包含test(忽略大小写)、url里面必须包含 cgi-bin 的请求
# 即：过滤掉匹配filter里面的请求
pattern operator1 operator2 excludeFilter://m:post includeFilter://h:cookie=test includeFilter:///cgi-bin/i

# 下面表示匹配pattern1、pattern2的请求方法为post、或请求头里面的cookie字段不能包含类似 `uin=123123` 且url里面必须包含 cgi-bin 的请求
operator pattern1 pattern2 includeFilter://m:post excludeFilter://h:cookie=/uin=o\d+/i excludeFilter:///cgi-bin/i

# 下面表示匹配pattern的请求忽略除了host以外的所有规则
pattern ignore://*|!host

# 下面表示匹配pattern的请求忽略file和host协议的规则
pattern ignore://file|host
```
