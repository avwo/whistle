# 匹配方式

> HTTPS、Websocket 需要 [开启 HTTPS 拦截](webui/https.md)，whistle 才能获取完整的请求 url，对这部分请求只有域名匹配能完整支持 (路径匹配只支持 `tunnel://host 或 tunnel://host:port`)，为了让匹配方式对所有请求都生效请先 [开启 HTTPS 拦截](webui/https.md)

whistle 对所有操作支持 ** 域名、路径、正则、精确匹配、通配符匹配、通配路径匹配 ** 六种种匹配方式 ([安装最新版本](update.md) 才能确保这些匹配方式都支持才支持)。

### 域名匹配
域名匹配可以匹配整个域名、限定域名的端口号、限定域名的请求协议，如果 operator-uri 不为请求路径，pattern 和 operator-uri 位置可以调换。

	# 匹配域名 www.test.com 下的所有请求，包括 http、https、ws、wss，tunnel
	www.test.com operator-uri

	# 匹配域名 www.test.com 下的所有 http 请求
	http://www.test.com operator-uri

	# 匹配域名 www.test.com 下的所有 https 请求
	https://www.test.com operator-uri

	# 上述匹配也可以限定域名的端口号
	www.test.com:8888 operator-uri # 8888 端口
	www.test.com/ operator-uri # http 为 80 端口，其它 443 端口

其中，tunnel 为 Tunnel 代理请求的协议，tunnel 协议的 url 只有根路径不支持子路径匹配。

### 路径匹配

路径匹配可以通过设置父路径来匹配请求 url，父路径也可以去掉请求协议，这样所有请求只要是该路径或该路径下的子路径都可以匹配，如果 operator-uri 不为请求路径，pattern 和 operator-uri 位置可以调换。

	# 限定请求协议，只能匹配 http 请求
	http://www.test.com/xxx operator-uri
	http://www.test.com:8080/xxx operator-uri

	# 匹配指定路径下的所有请求
	www.test.com/xxx operator-uri
	www.test.com:8080/xxx operator-uri

*Note: 协议包含 http、https、ws、wss，tunnel 共 5 种，tunnel 协议的 url 只有根路径不支持子路径匹配 *

### 正则匹配
正则的语法及写法跟 js 的正则表达式一致，支持两种模式：/reg/、/reg/i 忽略大小写，支持子匹配，<del > 但不支持 / reg/g</del>，且可以通过正则的子匹配把请求 url 里面的部分字符串传给 operator-uri，pattern 和 operator-uri 位置可以调换。

	# 匹配所有请求
	/./ operator-uri

	# 匹配 url 里面包含摸个关键字的请求，且忽略大小写
	/keyword/i operator-uri

	# 利用子匹配把 url 里面的参数带到匹配的操作 uri
	# 下面正则将把请求里面的文件名称，带到匹配的操作 uri
	/[^?#]\/([^\/]+)\.html/ protocol://...$1... #最多支持 9 个子匹配 $1...9

*Note: 协议包含 http、https、ws、wss，tunnel 共 5 种，tunnel 协议的 url 只有根路径不支持子路径匹配 *

### 精确匹配

与上面的路径匹配不同，路径匹配不仅匹配对应的路径，而且还会匹配该路径下面的子路径，而精确匹配只能指定的路径，只要在路径前面加 `$` 即可变成精确匹配，类似 `$url operator-uri`(v1.1.1 及以下版本可以用正则实现)，pattern 和 operator-uri 位置可以调换。

- 包含请求协议

		$http://www.test.com operator-uri
		$https://www.test.com/xxx? operator-uri

	这种情况分别只能匹配这两种请求：

	- `http://www.test.com`(浏览器会自动改为 `http://www.test.com/` 这两种等价)
	- `https://www.test.com/xxx?`

- 不包含请求协议

		$www.test.com/xxx operator-uri

	这种情况可以匹配如下四种请求：

	- `http://www.test.com/xxx`
	- `https://www.test.com/xxx`
	- `ws://www.test.com/xxx`
	- `wss://www.test.com/xxx`

*Note: 协议包含 http、https、ws、wss，tunnel 共 5 种，tunnel 协议的 url 只有根路径不支持子路径匹配 *

### 通配符匹配 (whistle 版本必须为 v1.4.10 及以上)
pattern 和 operator-uri 位置可以调换

	# 匹配二级域名以 .com 结尾的所有 url，如: test.com, abc.com，但不包含 *.xxx.com
	*.com file:///User/xxx/test
	//*.com file:///User/xxx/test

	# 匹配 test.com 的子域名，不包括 test.com
	# 也不包括诸如 *.xxx.test.com 的四级域名，只能包含: a.test.com，www.test.com 等 test.com 的三级域名
	*.test.com file:///User/xxx/test
	//*.test.com file:///User/xxx/test

	# 如果要配置所有子域名生效，可以使用 **
	**.com file:///User/xxx/test
	**.test.com file:///User/xxx/test

	# 限定协议，只对 http 生效
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

### 通配路径匹配 (whistle 版本必须为 v1.4.18 及以上)

	# 对所有域名对应的路径 protocol://a.b.c/xxx[/yyy] 都生效
	~/
	~/xxx
	tunnel://~/ # tunnel 只支持根路径匹配
	http://~/
	https://~/xxx
	ws://~/xxx
	wss://~/xxx

	# 也可以指定路径，不包含该路径的子路径
	$~/
	$~/xxx
	$tunnel://~/ # tunnel 只支持根路径匹配
	$http://~/
	$https://~/xxx
	$ws://~/xxx
	$wss://~/xxx

如： `~/cgi-bin 10.10.1.1:9999`，表示所有 `xxx.xxx.xxx/cgi-bin/xxx` 的请求都会请求 `10.10.1.1:9999` 对应的服务器。
