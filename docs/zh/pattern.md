# 匹配模式

> HTTPS、Websocket需要[开启HTTPS拦截](webui/https.html)才可以正常抓包及使用所有匹配模式，否则只能用域名匹配

> 有些老版本可能不支持以下的某种匹配模式，遇到这种情况可以[升级下whistle](update.html)即可


whistle的匹配模式(`pattern`)大体可以分成 **域名、路径、正则、精确匹配、通配符匹配**：

> 其中 正则匹配、精确匹配、通配符匹配支持取非，即 `!pattern`，表示不匹配 `pattern`
> 关键字符：`^`（通配路径表示符）、`$`（精确匹配）、`*`（通配符）、`!`（取非）

### 域名匹配
域名匹配，不仅支持匹配某个域名，也可以限定端口号、协议(`http`、`https`、`ws`、`wss`、`tunnel`)，如果operatorURI不为请求路径，pattern和operatorURI位置可以调换：

	# 匹配域名www.test.com下的所有请求，包括http、https、ws、wss，tunnel
	www.test.com operatorURI

	# 匹配域名www.test.com下的所有http请求
	http://www.test.com operatorURI

	# 匹配域名www.test.com下的所有https请求
	https://www.test.com operatorURI

	# 上述匹配也可以限定域名的端口号
	www.test.com:8888 operatorURI # 8888端口
	www.test.com/ operatorURI # http为80端口，其它443端口

其中，tunnel为Tunnel代理请求的协议，tunnel协议的url只有域名没有路径。

### 路径匹配
指定匹配某个路径，也可以限定端口号、协议(`http`、`https`、`ws`、`wss`)等等，如果operatorURI不为请求路径，pattern和operatorURI位置可以调换。

	# 限定请求协议，只能匹配http请求
	http://www.test.com/xxx operatorURI
	http://www.test.com:8080/xxx operatorURI

	# 匹配指定路径下的所有请求
	www.test.com/xxx operatorURI
	www.test.com:8080/xxx operatorURI
  */xxx operatorURI # 使用了通配符匹配特性

路径匹配不支持tunnel协议的url。

### 正则匹配
正则的语法及写法跟js的正则表达式一致，支持两种模式：/reg/、/reg/i 忽略大小写，支持子匹配，<del>但不支持/reg/g</del>，且可以通过正则的子匹配把请求url里面的部分字符串传给operatorURI，pattern和operatorURI位置可以调换。

	#匹配所有请求
	* operatorURI

	#匹配url里面包含摸个关键字的请求，且忽略大小写
	/keyword/i operatorURI

	# 利用子匹配把url里面的参数带到匹配的操作uri
	# 下面正则将把请求里面的文件名称，带到匹配的操作uri
	# 最多支持10个子匹配 $0...9，其中$0表示整个请求url，其它跟正则的子匹配一样
	/[^?#]\/([^\/]+)\.html/ protocol://...$1...
	
> 正则匹配支持非匹配 `!pattern`

### 精确匹配
与上面的路径匹配不同，路径匹配不仅匹配对应的路径，而且还会匹配该路径下面的子路径，而精确匹配只能指定的路径，只要在路径前面加`$`即可变成精确匹配，类似`$url operatorURI`，pattern和operatorURI位置可以调换。

- 包含请求协议
	```
	$http://www.test.com operatorURI
	$https://www.test.com/xxx? operatorURI
	```
	这种情况分别只能匹配这两种请求：
	```
	http://www.test.com # 浏览器会自动改为http://www.test.com/
	https://www.test.com/xxx?
	```

- 不包含请求协议
	```
	$www.test.com/xxx operatorURI
	```
	这种情况可以匹配如下四种请求：
	```
	http://www.test.com/xxx
	https://www.test.com/xxx
	ws://www.test.com/xxx
	wss://www.test.com/xxx
	```
	> 精确匹配支持非匹配 `!$url`

### 通配符匹配
域名、路径匹配不能满足一些复杂的情况，虽然正则匹配可以解决所有匹配问题，但门槛还是有点高，且涉及转义及设置匹配的起始位置等，对一些常用匹配whistle提供了一些更简单的配置方式，包含**通配符匹配，通配域名匹配、通配路径匹配**：

**通配符匹配**：

匹配模式必须以 `^` 开头(如果需要限制结束位置可以用 `$`)，`*` 为通配符，支持通过\$0...9获取通配符匹配的字符串，其中$0表示整个请求url
```
# 以 ^ 开头
^www.example.com/test/*** referer://http://www.test.com/$1

# 限定结束位置
^www.example.com/test/***test$ referer://http://www.test.com/$1

```

如果请求url为 `https://www.example.com/test/abc?123test`，这第一个配置 `$1 = abc?123&test`，第二个配置 `$1 = abc?123`，而 `https://www.example.com/test/abc?123test2` 只能匹配第一个。

通配符在请求url里面的不同位置及个数匹配的字符类型也不一样，一般请求url的结果：
```
 protocol://domain/path?query
```
完整通配符匹配：
```
^*://*.test.**.com:*/**?a=*&**  opProtocol://opValue($0, $1, ..., $9)
```

其中：\$0表示整个请求url，$1...9分别表示从左到右的通配符串，也可以不指定协议：
	
```
^*/cgi-* operatorURI # 相当于 /^\w+:\/\/([^./]*)\/cgi-(.*)/i  operatorURI
^**/cgi-* operatorURI # 相当于 /^\w+:\/\/([^/]*)\/cgi-(.*)/i  operatorURI
```

  - 如果通配符串在请求url的protocol里面，不管是一个还是多个 `*` 都只能匹配 `[a-z\d]*`
  - 如果通配符串在domain里面，一个 `*` 表示匹配 `[^/.]`，两个及以上的 `*` 表示匹配 `[^/]*`
	- domain里面的 `***.xxx.yyy` 相当于 `**.xxx.yyy` + `xxx.yyy` ([whistle >= v1.13.3](update.html))
  - 如果通配符串在path里面，一个 `*` 表示匹配 `[^/]`，两个 `*` 表示匹配 `[^？]*`，三个及以上的 `*` 表示匹配 `.*`
  - 如果通配符串在query里面，一个 `*` 表示匹配 `[^&]`，两个及以上的 `*` 表示匹配 `.*`
	> 通配符匹配支持非匹配 `!pattern`

**通配域名匹配**：

	# 匹配二级域名以 .com 结尾的所有url，如: test.com, abc.com，但不包含 *.xxx.com
	*.com file:///User/xxx/test
	//*.com file:///User/xxx/test

	# 匹配 test.com 的子域名，不包括 test.com
	# 也不包括诸如 *.xxx.test.com 的四级域名，只能包含: a.test.com，www.test.com 等test.com的三级域名
	*.test.com file:///User/xxx/test
	//*.test.com file:///User/xxx/test

	# 如果要配置所有子域名生效，可以使用 **
	**.com file:///User/xxx/test
	**.test.com file:///User/xxx/test

	# 限定协议，只对http生效
	http://*.com file:///User/xxx/test
	http://**.com file:///User/xxx/test
	http://*.test.com file:///User/xxx/test
	http://**.test.com file:///User/xxx/test

	# 路径
	*.com/abc/efg file:///User/xxx/test
	**.com/abc/efg file:///User/xxx/test
	*.test.com/abc/efg file:///User/xxx/test
	**.test.com/abc/efg file:///User/xxx/test

	http://*.com/abc/efg file:///User/xxx/test
	http://**.com/abc/efg file:///User/xxx/test
	http://*.test.com/abc/efg file:///User/xxx/test
	http://**.test.com/abc/efg file:///User/xxx/test

**通配路径匹配**：

	# 对所有域名对应的路径 protocol://a.b.c/xxx[/yyy]都生效
	*/ 127.0.0.1
	*/xxx 127.0.0.1:9999
	tunnel://*/ 127.0.0.1:9999 # tunnel只支持根路径匹配
	http://*/ 127.0.0.1
	https://*/xxx 127.0.0.1
	ws://*/xxx 127.0.0.1
	wss://*/xxx 127.0.0.1

	# 也可以指定路径，不包含该路径的子路径
	$*/ 127.0.0.1
	$*/xxx 127.0.0.1:9999
	$tunnel://*/  127.0.0.1 # tunnel只支持根路径匹配
	$http://*/ 127.0.0.1:9999
	$https://*/xxx 127.0.0.1:9999
	$ws://*/xxx 127.0.0.1:9999
	$wss://*/xxx 127.0.0.1

如： `*/cgi-bin 10.10.1.1:9999`，表示所有 `xxx.xxx.xxx/cgi-bin/xxx` 的请求都会请求 `10.10.1.1:9999` 对应的服务器。

**除此之外，可以结合 [filter(excludeFilter|includeFilter)](./rules/filter.html)实现 更复杂的匹配模式**
