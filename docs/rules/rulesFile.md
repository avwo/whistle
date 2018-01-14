# rulesFile

给匹配的请求批量设置规则，或者通过脚本动态设置规则，配置模式：

	pattern rulesFile://filepath
	
filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地js文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。

filepath指定的文本可以为一组规则列表，也可以一个js脚本通过判断url、method、clientIp、headers动态设置规则：

### 静态规则列表
whistle判断如果文件的第一行为规则的注释，即`#`开头，则任务filepath指定的是规则列表，会加载该列表，并进行二次匹配获取规则：

	# rules
	pattern1 operator-uri1
	pattern2 operator-uri2
	patternN operator-uriN
	
### 通过脚本动态设置规则
rulesFile可以指定一个脚本，whistle在执行脚本时会自动在全局传人：

1. `url`: 请求的完整路径
2. `method`: 请求方法 
3. `ip`: 客户端ip
4. `headers`: 请求头部 
5. `rules`: 存放新规则的数组

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
		rules.push('/./ redirect://http://www.ifeng.com/?test.js');
	}

	if (/html/.test(headers.accept)) {
		rules.push('/./ resType://text');
	}
	
	