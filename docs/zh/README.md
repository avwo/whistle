# 安装启动 {#install}

安装启动 whistle，需要以下几个步骤：

1. 安装 Node
2. 安装 whistle
3. 启动 whistle


### 1. 安装 Node

whistle 支持 `v0.10.0` 以上版本的 Node，为获取更好的性能，推荐安装最新版本的 Node。

如果你的系统已经安装了 `v0.10.0` 以上版本的 Node，可以忽略此步骤，直接进入安装 whistle 的步骤，否则：

1. Windows 或 Mac 系统，访问 [https://nodejs.org/](https://nodejs.org/)，安装 **LTS** 版本的 Node，默认安装即可。
2. Linux 下推荐使用源码安装: 从 [Node 官网](https://nodejs.org/en/download/) 下载最新版的 **Source Code**(或者用 `wget` 命令下载)，解压文件 (`tar -xzvf node-vx.y.z.tar.gz`) 后进入解压后的根目录 (`node-vx.y.z`)，依次执行 `./configure`、`./make` 和 `./make install`。

安装完 Node 后，执行下面命令，查看当前 Node 版本

```sh
$ node -v
v4.4.0
```
如果能正常输出 Node 的版本号，表示 Node 已安装成功 (Windows 系统可能需要重新打开 cmd)。


### 2. 安装 whistle

Node 安装成功后，执行如下 npm 命令安装 whistle （**Mac 或 Linux 的非 root 用户需要在命令行前面加 `sudo`，如：`sudo npm install -g whistle`**）

```sh
$ npm install -g whistle
```


npm 默认镜像是在国外，有时候安装速度很慢或者出现安装不了的情况，如果无法安装或者安装很慢，可以使用 taobao 的镜像安装：

```sh
$ npm install cnpm -g --registry=https://registry.npm.taobao.org
$ cnpm install -g whistle

或者直接指定镜像安装：
$ npm install whistle -g --registry=https://registry.npm.taobao.org
```

whistle 安装完成后，执行命令 `whistle help` 或 `w2 help`，查看 whistle 的帮助信息

```sh
$ w2 help

Usage: w2 <command> [options]

  Commands:

    run       Start a front service
    start     Start a background service
    stop      Stop current background service
    restart   Restart current background service
    help      Display help information

  Options:

    -h, --help                                      output usage information
    -d, --debug                                     debug mode
    -l, --localUIHost [hostname]                    local ui host(local.whistlejs.com by default)
    -n, --username [username]                       login username
    -w, --password [password]                       login password
    -S, --storage [newStorageDir]                   the new local storage directory
    -C, --copy [storageDir]                         copy storageDir to newStorageDir
    -p, --port [port]                               whistle port(8899 by default)
    -m, --middlewares [script path or module name]  express middlewares path(as: xx,yy/zz.js)
    -u, --uipath [script path]                      web ui plugin path
    -t, --timeout [ms]                              request timeout(36000 ms by default)
    -s, --sockets [number]                          max sockets(12 by default)
    -V, --version                                   output the version number
    -c, --command <command>                         command parameters ("node --harmony")

```

如果能正常输出 whistle 的帮助信息，表示 whistle 已安装成功。


### 3. 启动 whistle

> 最新版本的 whistle 支持三种等价的命令 `whistle`、`w2`、`wproxy`

启动 whistle:
```sh
$ w2 start
```

*Note: 如果要防止其他人访问配置页面，可以在启动时加上登录用户名和密码 `-n yourusername -w yourpassword`。*

重启 whsitle:
```sh
$ w2 restart
```

停止 whistle:
```sh
$ w2 stop
```

调试模式启动 whistle(主要用于查看 whistle 的异常及插件开发):
```sh
$ w2 run
```

### 启动多个 whistle
如果你想在同一台机器启动多个 whistle，方便多个浏览器或者供多人使用，有两种方式：

1. 切换到不同的系统用户，在每个系统用户启动一个 whistle 代理服务 (每个服务的端口号可以用命令行参数 `w2 start -p xxxx` 来指定)
2. 也可以通过切换规则目录和端口号的方式来解决 (注意 `S`、`C` 都是大写, newStorageDir 为空表示使用当前配置)

```
w2 start -S newStorageDir -p newPort

# 系统默认目录的配置拷贝到新的目录
w2 start -S newStorageDir -C -p newPort

# 也可以指定要拷贝的目录
w2 start -S newStorageDir -C storageDir -p newPort
```

*Note: 这种拷贝是覆盖式的，会替换目标目录里面原有文件，启动时设置了新的存储目录，关闭或重启时也要把目录参数带上 (端口号不要带上)：`w2 stop -S newStorageDir` 或 `w2 restart -S newStorageDir`*


比如分别在 `8899`，`8888`，`7788` 端口上开启 3 个实例：

```
# 默认端口 8899，系统默认存储目录
w2 start

# 端口号为 8888，存储目录为 8888，并把系统默认目录的配置 copy 到 8888 目录
w2 start -S 8888 -C

# 端口号为 7788，存储目录为 7788，并把 8888 目录的配置 copy 到 7788 目录
w2 start -S 7788 -C 8888
```

*Note: 不同实例要配置不同的代理 *


# 设置代理 {#settings}

### 配置信息

1. 代理服务器：127.0.0.1(如果部署在远程服务器或虚拟机上，改成对应服务器或虚拟机的 ip 即可)
2. 默认端口：8899(如果端口被占用，可以在启动是通过 `-p` 来指定新的端口，更多信息可以通过执行命令行 `w2 help` (`v0.7.0` 及以上版本也可以使用 `w2 help`) 查看)

> 勾选上 ** 对所有协议均使用相同的代理服务器 **


### 代理配置方式 (把上面配置信息配置上即可)

1. 直接配置系统代理：　
  * [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html)
  * [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. 安装浏览器代理插件 (** 推荐 **)

	* 安装 Chrome 代理插件： [whistle-for-chrome 插件](https://github.com/avwo/whistle-for-chrome) 或者 [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	* 安装 Firefox 代理插件： [Proxy Selector](https://addons.mozilla.org/zh-cn/firefox/addon/proxy-selector/)

3. 移动端需要在 ` 设置 ` 中配置当前 Wi-Fi 的代理

PS: 如果配置完代理，手机无法访问，可能是 whistle 所在的电脑防火墙限制了远程访问 whistle 的端口，关闭防火墙或者设置白名单：[ http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html]( http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)


### 访问配置页面

启动 whistle 及配置完代理后，用 **Chrome 浏览器 (由于 css 兼容性问题界面只支持 Chrome 浏览器)** 访问配置页面，如果能正常打开页面，whistle 安装启动完毕，可以开始使用。

可以通过以下两种方式来访问配置页面：

* 方式 1：域名访问 [http://local.whistlejs.com/](http://local.whistlejs.com/)
* 方式 2：通过 ip + 端口来访问，形式如 `http://whistleServerIP:whistlePort+1/` e.g. [http://127.0.0.1:8900](http://127.0.0.1:8900)


# 安装证书 {#https}

> 建议使用 `Node v6` 或以上版本，否则性能及在 Chrome 或 APP 上 [抓包 HTTPS 请求](https://avwo.github.io/whistle/webui/https.html) 会有问题。

> 如果出现 HTTPS 的问题 ([#44](https://github.com/avwo/whistle/issues/44))，升级 Node 到 `v6` 及以上版本，[更新 whistle](https://avwo.github.io/whistle/update.html) 到最新版本，通过 `w2 restart -A` (注意后面加 `-A`)启动生成新的更证书，再 [安装下根证书](https://avwo.github.io/whistle/webui/https.html) 即可。

> ** 在 iOS 上安装根证书时，需要先关闭[https 拦截](https://avwo.github.io/whistle/webui/https.html)，否则将显示安装失败。**

用来下载根证书、隐藏 `connect` 类型的请求、开启 Https 拦截功能。

![Https](https://avwo.github.io/whistle/img/https.gif)


### 安装根证书

如上图下载完根证书后点击 rootCA.crt 文件，弹出根证书安装对话框。

1. Windows：[http://program.most.gov.cn/cert/ca.htm](http://program.most.gov.cn/cert/ca.htm)
2. Mac：[mac 根证书怎么安装](http://zhidao.baidu.com/link?url=bQ8ZnDTxUIlqruQ56NYjBmwztWPlZtv9AIRazkoKeMsdpAq7mcwXOHQduRwmHV1M2hf143vqBxHzKb1tg0L03DJoj6XS109P8zBNF1E9uU_)

  Mac 安装证书后，需要手动信任证书，步骤如下：

  打开证书管理界面，找到带有 `whistle` 的字样的证书，如果有多个又不确定最新安装的是哪个，可以全部删除后重新安装

  ![img](https://ae01.alicdn.com/kf/HTB1ZtoBdYsTMeJjSszh763GCFXai.png)

  双击证书后，点击 `Trust` 左边展开选项，红色部分选择 `Always Trust` （总是信任），点击左上角关闭当前界面会要求输入密码；输入密码后可以看到证书上面红色的图标 `x` 不见了，到这一步说明完成证书安装。

  ![img](https://ae01.alicdn.com/kf/HTB1UWItd8USMeJjy1zk761WmpXaT.png)

3. **Firefox：菜单 > 首选项 > 高级 > 证书 > 证书机构 > 导入 -> 选中所有 checkbox -> 确定 **
4. Linux Chrome(Chromium): 参照这个[教程](http://www.richud.com/wiki/Ubuntu_chrome_browser_import_self_signed_certificate)
  * 地址栏输入 `chrome://chrome/settings/`
  * Show advanced Settings > Manage certificates > Authorities > Import
  * 选择证书后确认，重启浏览器
  * done

  ![ubuntu Chromium](https://cloud.githubusercontent.com/assets/16034964/20553721/9c3d1bda-b191-11e6-880f-9fd6976b95cc.png)
5. 手机

  **iOS**
  * 手机设置代理后，Safari 地址栏输入 `rootca.pro`，按提示安装证书（或者通过 `whistle` 控制台的二维码扫码安装，iOS 安装根证书需要到连接远程服务器进行验证，需要暂时把 **Https 拦截功能关掉 **）
  * iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="https://avwo.github.io/whistle/img/ios10.3_ca.PNG" width="320">

  **Android**
  * `whistle` 控制台二维码扫码安装，或者浏览器地址栏 `rootca.pro` 按提示安装
  * 部分浏览器不会自动识别 ca 证书，可以通过 Android Chrome 来完成安装

### 开启拦截 Https

图中的打开的对话框有两个 checkbox(** 在 iOS 安装根证书的时候，记得不要开启 ` Intercept HTTPS CONNECTs`，否则将无法安装成功 **)：

1. ` Hide HTTPS CONNECTs`：隐藏 `connect` 类型的请求
2. ` Intercept HTTPS CONNECTs`：开启 Https 拦截功能，只有勾上这个 checkbox 及装好根证书，whistle 才能看到 HTTPS、Websocket 的请求
3. 也可以通过配置来开启对部分请求的 Https 拦截功能

   www.test.com filter://intercept
   /alibaba-inc/ filter://intercept
   ​
4. 如果想过滤部分请求不启用 Https 拦截功能

  ```
  # 指定域名
  www.baidu.com  disable://intercept
  # 通过正则
  /baidu/ disable://intercept
  # 不支持通过路径的方式设置
  ```


# 快速入门 {#quickstart}

> 推荐看这篇文章：[whistle 工具全程入门](http://imweb.io/topic/596480af33d7f9a94951744c)

按 [上述方法](#install) 安装好 whistle 后，用 Chrome 浏览器打开配置页面: [http://local.whistlejs.com](http://local.whistlejs.com/)

如图[Rules](#webui_rules)，whistle 的 Rules 配置页面有一个默认分组 `Default`，用户也可以通过上面的菜单栏按钮 `Create`、`Edit`、`Delete` 分别创建、重命名、删除自定义分组，whistle 先在选中的用户自定义分组中从上到下依次匹配，然后再到 `Default` 中匹配(如果 `Default` 分组被启用的情况下)。

点击页面上方菜单栏的 `Create` 按钮，新建一个名为 `test` 的分组，并参照下面例子输入对应的规则配置。

1. 设置 hosts

	指定 [www.ifeng.com](http://www.ifeng.com/) 的 ip:
	```
  www.ifeng.com 127.0.0.1
  # or
  127.0.0.1 www.ifeng.com
	```

  指定 [www.ifeng.com](http://www.ifeng.com/) 的 ip 和端口，把请求转发到本地 8080 端口，这个在平时开发中可以用来去掉 url 中的端口号:

	```
  # www.ifeng.com 127.0.0.1
  www.ifeng.com 127.0.0.1:8080
  # or
  127.0.0.1:8080 www.ifeng.com
  ```

	也可以用某个域名的 ip 设置 hosts

  ```
  www.ifeng.com host://www.qq.com:8080
  # or
  host://www.qq.com:8080 www.ifeng.com
	```
 更多匹配方式参考：[匹配方式](#pattern)

2. 本地替换

	平时开发中经常会用到这个功能，把响应替换成本地文件内容。

	```
  # Mac、Linux
  www.ifeng.com file:///User/username/test
  # or www.ifeng.com file:///User/username/test/index.html

  # Windows 的路径分隔符可以用 \ 或者 /
  www.ifeng.com file://E:\xx\test
  # or www.ifeng.com file://E:\xx\test\index.html
	```

	[http://www.ifeng.com/](http://www.ifeng.com/)会先尝试加载 `/User/username/test` 这个文件，如果不存在，则会加载 `/User/username/test/index.html`，如果没有对应的文件则返回 404。

	[http://www.ifeng.com/xxx](.md)会先尝试加载 `/User/username/test/xxx` 这个文件，如果不存在，则会加载 `/User/username/test/xxx/index.html`，如果没有对应的文件则返回 404。

	也可以替换 jsonp 请求，具体参见[tpl](#rules_rule_tpl)

3. 请求转发

	[www.ifeng.com](http://www.ifeng.com/)域名下的请求都替换成对应的 www.aliexpress.com 域名

  ```
	www.ifeng.com www.aliexpress.com
	```

4. 注入 html、js、css

	whistle 会自动根据响应内容的类型，判断是否注入相应的文本及如何注入(是否要用标签包裹起来)。

  ```
  # Mac、Linux
  www.ifeng.com html:///User/xxx/test/test.html
  www.ifeng.com js:///User/xxx/test/test.js
  www.ifeng.com css:///User/xxx/test/test.css

  # Windows 的路径分隔符可以用 `\` 和 `/`
  www.ifeng.com html://E:\xx\test\test.html
  www.ifeng.com js://E:\xx\test\test.js
  www.ifeng.com css://E:\xx\test\test.css
	```

  所有 www.ifeng.com 域名下的请求，whistle 都会根据响应类型，将处理好的文本注入到响应内容里面，如是 html 请求，js 和 css 会分别自动加上 `script` 和 `style` 标签后追加到内容后面。

5. 调试远程页面

	利用 whistle 提供的 [weinre](#rules_weinre) 和 [log](#rules_log) 两个协议，可以实现修改远程页面 DOM 结构及自动捕获页面 js 错误及 console 打印的信息，还可以在页面顶部或 js 文件底部注入指定的脚步调试页面信息。

	使用 whistle 的功能前，先把要相应的系统代理或浏览器代理指向 whistle，如何设置可以参考：[安装启动](#install)

	weinre：

	```
	www.ifeng.com weinre://test
	```

	配置后保存，打开[www.ifeng.com](http://www.ifeng.com/)，鼠标放在菜单栏的 weinre 按钮上会显示一个列表，并点击其中的 `test` 项打开 weinre 的调试页面选择对应的 url 切换到 Elements 即可。

	log:

	```
	www.ifeng.com log://{test.js}
	```

	配置后保存，鼠标放在菜单栏的 weinre 按钮上会显示一个列表，并点击其中的 `test.js` 项，whistle 会自动在 Values 上建立一个 test.js 分组，在里面填入 `console.log(1, 2, 3, {a: 123})` 保存，打开 Network -> 右侧 Log -> Page，再打开[www.ifeng.com](http://www.ifeng.com/)，即可看到 Log 下面的 Page 输出的信息。

6. 手机设置代理

<div style="display:-webkit-box;display:flex;">
  <div style="display:inline-block;width:40%;margin-left:5%;">
    <img src="https://avwo.github.io/whistle/img/iOS_proxy_settings.png" alt="iOS" style="display:block;width:100%;">
    <br>
    <p style="text-align:center">iOS</p>
  </div>
  <div style="display:inline-block;width:40%;margin-left:5%;">
    <img src="https://avwo.github.io/whistle/img/Android_proxy.png" alt="Android" style="display:block;width:100%;">
    <br>
    <p style="text-align:center">Android</p>
  </div>
</div>


更多功能请参考：[协议列表](#rules)


# 常见问题 {#questions}

> 有问题可以提 issue： [New issue](https://github.com/avwo/whistle/issues/new)

1. 为什么 [http://local.whistlejs.com](http://local.whistlejs.com/) 无法访问？

 没有启动 whistle 或者配置代理，具体操作请参考 [安装启动](#install)

2. 为什么 **Network** 上看不到请求？

 没有用 Chrome 浏览器访问 [http://local.whistlejs.com](http://local.whistlejs.com/)，或者是请求没有代理到指定的 whistle，如何配置代理请参考 [安装启动](#install)

3. 手机或平板如何抓包请求？

 需要配置代理，且可能要关闭防火墙或者设置运行远程访问本地指定端口，具体参考 [安装启动](#install)

4. 为什么设置的规则对 https 请求不生效？

 需要安装根证书及开启 https 拦截，具体参考 [https](#webui_https)

 PS: Firefox 自带根证书列表，系统根证书对 Firefox 不生效，需要对 Firefox 单独安装根证书。

5. 如何查看错误信息？

 如果是请求出错，可以在 Network 里面的 Request 或 Response 的 Text 里面看到，有些请求会把异常作为响应内容直接输出到界面；如果是内部运行出现的非致命性异常，可以在 Network -> Log -> Server 里面看到；如果是导致程序 crash 的异常，日志信息会写在命令行启动的目录的 `whistle.log` 文件。

6. 如何在一台机器同时启多个 whistle？

 可以通过设置不同端口号及不同存储目录来启动不同 whistle 实例，具体参考 [安装启动](#install)。

7. 如何实现反向代理的功能？

 whistle 作为反向代理只支持 http 访问，启动 whistle 时设置监听的端口为 80:

		w2 start -p 80
		# 或
		w2 restart -p 80


 非 root 用户需要加 `sudo w2 start -p 80`。
 ​
 根据域名、或路径、或正则表达式配置带端口的 host：

		www.test1.com host://127.0.0.1:8080
		www.test2.com host://127.0.0.1:8181

 这样访问 `www.test1.com` 或 `www.test2.com` 的请求会自动转到 8080 或 8181 端口，实现无端口访问。
PS：如果要用 IP 访问，可以采用 `http://127.0.0.1/-/xxx` 或 `http://127.0.0.1/_/xxx`，whistle 会自动转成 `http://127.0.0.1/xxx`

8. 如何让 Rules 支持多选？

 在 [Rules](#webui_rules) 界面中打开 Settings 对话框，选中 `Allow multiple choice` 即可。

9. 如何动态设置 Rules？

  whistle 支持以下两种方式动态设置：

  - 通过 [dispatch](#rules_dispatch) 根据请求信息修改请求 url 的参数改变 url，达到动态修改匹配规则的能力
  - 通过 [插件方式](#plugins_plugins) 的方式动态设置规则，这种方式更加直接，且功能更强大，基本上可以操作 whistle 的任何功能，且可以自定义协议功能

10. 如何过滤调部分规则？

 某些情况下，需要把匹配到的某部分请求过滤掉，这个时候可以用 [filter](#rules_filter) 来设置过滤 `pattern filter://xxx|yyy|zzz|...`，如果想过滤做本地替换时本地没有对应文件的请求可以用 [xfile](#rules_rule_xfile)。

11. 安装根证书时无法下载，检查下是否设置好代理。

12. iOS 安装根证书时提示无法连接后台服务器，检查下是否开启了 **Https 拦截功能 **，如果已开启，请暂时关闭，根证书安装成功再开启。

13. iOS 10.3 证书问题
  `iOS SSLHandshake: Received fatal alert: unknown_ca`，出现这个错误是因为 iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="https://avwo.github.io/whistle/img/ios10.3_ca.PNG" width="320">


# 匹配方式 {#pattern}

> HTTPS、Websocket 需要 [开启 HTTPS 拦截](#webui_https)，whistle 才能获取完整的请求 url，对这部分请求只有域名匹配能完整支持 (路径匹配只支持 `tunnel://host 或 tunnel://host:port`)，为了让匹配方式对所有请求都生效请先 [开启 HTTPS 拦截](#webui_https)

whistle 对所有操作支持 ** 域名、路径、正则、精确匹配、通配符匹配、通配路径匹配 ** 六种种匹配方式 ([安装最新版本](#update) 才能确保这些匹配方式都支持才支持)。

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


# 操作值 {#opvalue}

whistle 的所有操作都可以通过配置实现，配置模式扩展于系统 hosts 配置模式 (`ip domain` 或组合模式 `ip domain1 domain2 domainN`)，具有更丰富的[匹配方式](#pattern) 及更灵活的配置模式。whistle 的匹配顺序是从左到右，这与传统 hosts 从右到左的配置模式不同，但为了兼容传统 hosts 配置模式，除了 pattern 和 operator-uri 都可以为请求 url 外(这种情况 whistle 无法自动区分 pattern 和 operator-uri，只能按约定的顺序匹配)，其它情况 whistle 都支持配置两边的位置对调，即：`pattern operator-uri` 和 `operator-uri pattern` 等价。

> whistle 跟传统 hosts 配置一样也采用 `#` 为注释符号


### whistle 有以下三种匹配模式：

1. 默认模式

	默认是将匹配方式写在左边，操作 uri 写在右边

    pattern operator-uri

	whistle 将请求 url 与 pattern 匹配，如果匹配到就执行 operator-uri 对应的操作

2. 传统模式

	传统模式指的是传统的 hosts 配置模式，操作 URI 写在左边

		operator-uri pattern

	如果 pattern 为路径或域名，且 operator-uri 为域名或路径

		www.test.com www.example.com/index.html
		http://www.test.com www.example.com/index.html

	这种情况下无法区分 pattern 和 operator-uri，whistle 不支持这种传统的模式，只支持默认模式

3. 组合模式

	传统 hosts 的配置对多个域名对于同一个 ip 可以采用这种模式：

		127.0.0.1  www.test1.com www.test2.com www.testN.com

	whistle 完全兼容传统 hosts 配置模式，且支持更多的组合模式：
  ```
  # 传统组合模式
  pattern operator-uri1 operator-uri2 operator-uriN
  # 如果 pattern 部分为路径或域名，且 operator-uri 为域名或路径
  # 这种情况下也支持一个操作对应多个 pattern
  operator-uri pattern1 pattern2 patternN
  ```
其中，pattern 请参考：[匹配方式](#pattern)


# 插件开发 {#plugins}

有些功能用的比较少的功能，及一些跟业务相关的功能，如：

- 查看 websocket 的传输内容
- 查看如图片等富媒体资源
- 集成一些本地服务(处理[combo 请求](https://github.com/whistle-plugins/whistle.tianma))
- 动态设置规则(通过远程服务器动态判断请求设置哪些规则)
- 加载本地指定的规则文件

等等，考虑到会导致安装过程比较长或者占用内存空间或者适应范围比较小，whistle 没有把这些功能加进去，但提供了插件的方式扩展这些功能。

whistle 插件本身就是一个普通的 Node 模块，只是名字要按照 `whistle.xxx` 的形式命名，其中 `xxx` 指插件的名称且只能包含小写字母、数字、_、- 四种字符，如：[whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)、[whistle.tianma](https://github.com/whistle-plugins/whistle.tinama)、[whistle.vase](https://github.com/whistle-plugins/whistle.vase)，而 `xxx` 就是扩展的协议，可以直接在 Rules 里面配置使用，我们先看下 whistle 的时序图及插件的结构，了解 whistle 如何加载执行插件，然后再讲下如何开发、发布、安装插件。

whistle 的时序图：

![whistle 的时序图](https://avwo.github.io/whistle/img/seq.png)

### 编写插件

whistle 插件目录结构：

	whistle.xxx
		|__ package.json
		|__ rules.txt
		|__ _rules.txt
		|__ index.js
		|__ lib
			  |__ uiServer.js
			  |__ statusServer.js
			  |__ rulesServer.js
			  |__ server.js
			  |__ resRulesServer.js

除了 package.json，其它都是可选的，其中(参考时序图)：

- package.json

		{
		    "name": "whistle.xxx",
		    "version": "0.0.1",
		    "description": "xxxx",
		    "homepage": "插件的帮助或官网链接",
		    //others
		}

- rules.txt: 插件的全局规则，只要插件启用，所有请求都会查找匹配
- _rules.txt: 插件的私有规则，只有请求匹配插件的规则 `xxx://value`，才会去查找匹配
- index.js

		module.exports = require('./lib/server');
		module.exports.uiServer = require('./lib/uiServer');
		module.exports.rulesServer = require('./lib/rulesServer');
		module.exports.resRulesServer = require('./lib/resRulesServer');

- lib/uiServer: `xxx.local.whistlejs.com` 域名下的请求都会直接访问该 server，可用于后台管理界面

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的相关事件处理 ui 相关的请求(http 或 websocket)
			*/
		};

- lib/statusServer: 状态服务器，whistle 会把请求的各种状态 post 过来，请求只要匹配了插件的协议规则 `xxx://value 或 plugin://xxx(value)`(`xxx` 为插件 `whistle.xxx` 的名称)

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取请求信息，
			* 并返回新的规则
			*/
		};

- lib/rulesServer: 规则服务器，请求只要匹配了插件的协议规则 `xxx://value 或 plugin://xxx(value)`(`xxx` 为插件 `whistle.xxx` 的名称)，就会把一些请求带放在头部请求该 server，该 server 可以根据需要返回新的规则

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取请求信息，
			* 并返回新的规则
			*/
		};

- lib/server: 处理请求的 server，可以做请求合并等，返回的数据就是请求的响应数据

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的相关事件处理 whistle 转发过来的请求
			*/
		};

- lib/resRulesServer: 响应规则服务器，在请求响应后到达浏览器前 whistle 会把一些请求信息传给该 server，该 server 可以返回新的规则

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取响应信息，
			* 并返回新的处理响应的规则
			*/
		};


- options

		{
			name: // 插件的名称,
			RULE_VALUE_HEADER: // 存储配置的规则值的请求头字段,
			SSL_FLAG_HEADER: // 判断是否为 HTTPS 请求的请求头字段,
			FULL_URL_HEADER: // 存储请求完整 url 的请求头字段,
			REAL_URL_HEADER: // 存储配置映射到 url 的请求头字段,
			NEXT_RULE_HEADER: // 存储配置的下个规则 (第一规则为插件) 的请求头字段,
			REQ_ID_HEADER: // 请求的 id，可以用于区分响应和请求是否同一个,
			DATA_ID_HEADER: // 数据包对应的 id，不一定存在,
			STATUS_CODE_HEADER: // 配置的响应状态码,
			LOCAL_HOST_HEADER: // 配置的 hosts,
			HOST_PORT_HEADER: // 配置的端口,
			METHOD_HEADER: // 请求方法,
			debugMode: // 是否是通过 w2 run 启动的,
			config: // 包括 whistle 的端口号 port 等一系列 whistle 的配置,
			storage: // 提供本地存储的接口，用法参考：https://github.com/avwo/whistle/blob/master/lib/rules/util.js
		}

whistle 插件的每部分都可以独立存在，各个部分的关系及与 whistle 的关系可以看时序图，也可以参考其它参加的实现方式：[https://github.com/whistle-plugins](https://github.com/whistle-plugins)，[whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)

### 调试插件

把本地 node 模块 link 到全局目录：

	$ npm link
	或 sudo npm link

	# 开启 whistle 的调试模式
	$ w2 run

这样 whistle 会自动加载改插件，如果插件有代码更新，需要触发修改 package.json 这个文件，比如加个空格，或者直接加个字段，每次修改下这个字段，whistle 会检查 package.json 是否有更改，如果更改的话会自动重启。

卸载本地插件：

	npm unlink
	# 或 sudo npm unlink

	# 如果 npm link 不是在模块所在根目录执行，可以采用下面这种方式卸载本地开发的全局模块
	npm unlink whistle.xxx -g
	# 或 sudo npm unlink whistle.xxx -g

### 发布插件
同发布正常的 node 模块，模块编写完毕，可以通过以下几种方式发布：

1. 公共的 node 模块，直接上传到 npm 仓库：

		# 登陆 npm login 后，在模块的根目录 (package.json 所在目录) 执行
		npm publish

2. 自建的 npm 仓库，有些公司会自建自己的仓库

		xnpm publish

### 安装插件
同安装全局的 node 模块，只需直接通过 npm 安装，需要安装到全局

	npm install -g whistle.protocol
	# 或
	xnpm install -g whistle.protocol
	# 或
	xnpm install -g @org/whistle.protocol


### 更新插件
可以通过直接重复上述安装插件的方式强制更新，直接通过 npm 更新:

	npm update -g whistle.protocol
	# 或
	xnpm update -g whistle.protocol
	# 或
	xnpm update -g @org/whistle.protocol


### 卸载插件


	npm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g @org/whistle.protocol



### 使用插件
安装完插件，直接可以在 whistle 中配置

	pattern   protocol://ruleValue

	配置完以后 whistle 会自动把匹配到的请求转发到对应 protocol 的插件 whistle.protocol 上，并把 ruleValue 传给插件服务器



更多内容可以参考：

1. [https://github.com/whistle-plugins/whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)
2. [https://github.com/whistle-plugins](https://github.com/whistle-plugins)


# 界面列表 {#webui}

* [Network(请求列表页面)](#webui_network)
* [Composer(构造请求)](#webui_composer)
* [Log(日志平台)](#webui_log)
* [Rules(操作规则配置界面)](#webui_rules)
* [Values(存放 KeyValue 的系统)](#webui_values)
* [Plugins(插件列表页面)](#webui_plugins)
* [WebSocket(设置对话框)](#webui_websocket)
* [Settings(设置对话框)](#webui_settings)
* [Weinre(weinre 列表)](#webui_weinre)
* [Https(设置 Https 及根证书)](#webui_https)
* [Help(帮助文档)](#webui_help)
* [About(whistle 版本信息)](#webui_about)
* [Online(在线状态及服务器信息)](#webui_online)


# Network {#webui_network}

查看请求响应的详细信息及请求列表的Timeline，还有请求匹配到的规则(见`Overview`)。

![Network](https://avwo.github.io/whistle/img/network.gif)

界面操作的一些快捷键：

1. `Ctrl + X`(Mac用`Command + X`): 清空请求列
2. `Ctrl + D`(Mac用`Command + D`):
	- 如果是焦点在下面的过滤输入框，可以清空输入框的内容
	- 如果焦点在Network的其它地方，可以删除选中的请求项

更多功能及快捷键参考下图：

![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.png)

# Componser {#webui_composer}

用来重发请求、构造请求，可以自定义请求的 url、请求方法、请求头、请求内容。

![Componser](https://avwo.github.io/whistle/img/composer.gif)

# Log {#webui_log}

用于调试远程页面特别是移动端页面，可以通过此功能把远程页面的 `console` 打印的信息展示出来，也可以在注入自定义的 js 脚本，使用方法参见 [log](#webui_rules_log)。

![Log](https://avwo.github.io/whistle/img/log.gif)

其中：

1. Page 显示页面抛出的异常或 `console` 打印的信息
2. Server 为 whistle 内部发生的异常信息

# Rules {#webui_rules}

> 所有规则参考：[规则列表](#webui_rules)、[多种匹配方式](#webui_pattern)

规则配置界面：

1. `Create`：创建规则分组
2. `Delete`：删除分组
3. `Edit`：重命名分组
4. `Settings`：
 - `Theme`：设置主题
 - `Font size`：设置字体大小
 - `Show line number`：是否显示行数
 - `Allow multiple choice`：是否允许多选
 - `Disable all rules`：是否禁用所有规则，包括插件的规则
 - `Disable all plugins`：是否禁用插件规则
 - `Synchronized with the system hosts`：是否把配置同步到本地的 hosts 文件 (需要 root 权限)
 - `Import system hosts to Default`：导入本地的 hosts 配置到 Default 分组 (需要 root 权限，且会覆盖原来的配置)

![Rules](https://avwo.github.io/whistle/img/rules.gif)

界面操作的一些快捷键：

1. `Ctrl + D`(Mac 用 `Command + D`):
	- 如果焦点在左侧的列表，可以删除列表项
	- 如果焦点在右侧的编辑框，可以删除光标所在行
2. `Ctrl + ?`(Mac 用 `Command + ?`): 注释编辑框中选中的行
3. `Ctrl + S`(Mac 用 `Command + S`): 保存当前编辑的内容
4. Ctrl + MouseDown`(Mac 用 `Command + MouseDown `): 可以让形如 xxx://{key} 快速定位到 values 中对应的 key (可以通过浏览器的前进回退按钮回退到跳转前的页面)



## Rules 的特殊操作符 (`{}`、`()`、`<>`)


### `{}` 操作符

打开 [配置页面](http://local.whistlejs.com/) 右上角的 More --> Values 对话框，这是一个 key-value 配置系统，创建一个 key: index.html，并随便写上一段 html；

配置规则：

	www.example.com res://{index.html}

*Note: windows 按住 Ctrl 键 (Mac 可以按住 Command 键)，点击配置框里面的 `res://{index.html}`，可以快速打开 Values 对话框并创建或定位到对应的 key*

### `()` 操作符

	可以通过 `()` 直接在 [配置页面](http://www.example.com/) 上设置 value

	www.example.com res://({"delay":6000,"body":"1234567890"}) # () 里面不能有空格

### `<>` 操作符

在做本地替换时，whistle 会自动进行路径拼接：

	www.example.com xfile://</Users/index.html>

上述配置后请求 http://www.example.com/index.html 会直接加载本地的 /Users/index.html 文件，不会再自动做 url 拼接。


# Values {#webui_values}

配置 `key-value` 的数据，在 Rules 里面配置可以通过 `{key}` 获取，如：`www.ifeng.com file://{key}`

![Values](https://avwo.github.io/whistle/img/values.gif)

界面操作的一些快捷键：

1. `Ctrl + D`(Mac 用 `Command + D`):
	- 如果焦点在左侧的列表，可以删除列表项
	- 如果焦点在右侧的编辑框，可以删除光标所在行
2. `Ctrl + /`(Mac 用 `Command + /`): 注释编辑框中选中的行
3. `Ctrl + S`(Mac 用 `Command + S`): 保存当前编辑的内容

# Plugins {#webui_plugins}

> 如何开发插件参考：[插件开发](#webui_plugins)

显示所有已安装的插件列表，开启关闭插件功能，打开插件的管理页面等。

![Plugins](https://avwo.github.io/whistle/img/plugins.gif)

# websocket {#webui_websocket}

whistle v1.6.0 开始支持 WebSocket 及一般 Socket 请求的抓包及构造请求，点击建立连接的 WebSocket(Socket) 请求，打开 右侧 `Response / Frames` 即可看到 WebSocket 的请求贞数据：

![WebSocket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/frames.gif)

PS：如果是普通的 Socket 请求要通过 whistle 代理，要走 tunnel 代理，且代理的请求头要加个字段 `x-whistle-policy: tunnel`，这样 whistle 就会把这个请求当成一般的 socket 请求处理，且可以跟 WebSocket 一样进行抓包

也支持构造 WebSocket 请求和一般的 Socket 请求，通过 whistle 的 Composer 构造的 WebSocket 和 Socket 请求，还也自定义请求数据：

![Build WebSocket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/composer.gif)


![Build Socket](https://raw.githubusercontent.com/avwo/whistleui/master/img/socket/socket.gif)



PS：通过 Composer 构造的请求 Frames 多了一个 Composer 选项，可以通过该模块发送数据到服务器，也可以通过拖拽文件到此把文件里面的数据发送到后台；构造 Socket 请求的 url 为 `CONNECT` 方法，或者 schema 为：`conn:`、`connect:`、`socket:`、`tunnel:`，如果 `conn://127.0.0.1:9999`，上述图中本地服务器代码为：

	const net = require('net');

	const port = 9999;
	const server = net.createServer();
	server.on('connection', (s) => {
	  s.on('error', () => {});
	  s.on('data', (data) => {
	    s.write(`Response: ${data}`);
	  })
	});
	server.listen(port);




如果对一般的请求也要像构造请求一样可以自定义发送或接收数据，需要借助插件 [whistle.script](https://github.com/whistle-plugins/whistle.script)，具体参见文章：[利用 whistle 调试 WebSocket 和 Socket 请求](http://imweb.io/topic/5a11b1b8ef79bc941c30d91a)


# Settings {#webui_settings}

在 whistle 的界面中，分别有 **Network**、**Rules**、**Values** 三个页面有 **Settings** 菜单，其中，**Rules** 和 **Values** 的 **Settings** 主要用于设置编辑器样式及是否允许多选 Rules，具体分别参见：[Rules 界面说明](#webui_webui_rules) 和 [Values 界面说明](#webui_webui_values)。

#### Network

1. Filter：用来设置过滤请求的关键字，Networt 的 Settings 按钮上的 Filter 和请求列表下方的 Filter 的区别是，前者会把不匹配的请求直接过滤掉，无法再找回来，而后后者只是把列表中的 Dom 节点隐藏了，且 Settings 按钮上的 Filter 功能更强大，可以同时匹配 url、请求响应头、请求方法、响应状态码、ClientIP 及 ServerIP、请求响应内容 (以上匹配都不区分大小写)。

	Filter:

		test1 test2 test2
		key1 key2 key3
		h:head1 heade2 head3
		h: h1 h2
		s: 200
		i: 100 88
		i: 11 77
		m: get
		b: keyword1 keyword2
		b: keyword3

	`h:`、`s:`、`i:`、`m:`、`b:` 分别表示匹配请求响应头、请求方法、响应状态码、ClientIP 及 ServerIP、请求响应内容、其它表示匹配 url(以上匹配都不区分大小写)，同一行内容多个匹配用空格隔开，最多支持 3 个，表示对应的内容要同时匹配这三个关键字，不同行表示或的关系。
  也支持取反操作，即 `!host1` 会保留请求url中不包含host1的流量。


2. Network Columns：主要用于设置 Network 表头，或者拖拽重排等

![Network settings](https://avwo.github.io/whistle/img/settings.png)


# Weinre {#webui_weinre}

集成 [weinre](http://people.apache.org/~pmuellr/weinre/docs/latest/) 的功能，用户只需通过简单配置 (`pattern weinre://id`) 即可使用，具体参见[weinre](#webui_rules_weinre)，更多移动端调试方法可以参考：[利用 whistle 调试移动端页面](http://imweb.io/topic/5981a34bf8b6c96352a59401)。

![Weinre](https://avwo.github.io/whistle/img/weinre.gif)

# Https {#webui_https}

> 建议使用 `Node v6` 或以上版本，否则性能及在 Chrome 或 APP 上 [抓包 HTTPS 请求](https://avwo.github.io/whistle/webui/https.html) 会有问题。

> 如果出现 HTTPS 的问题 ([#44](https://github.com/avwo/whistle/issues/44))，升级 Node 到 `v6` 及以上版本，[更新 whistle](https://avwo.github.io/whistle/update.html) 到最新版本，通过 `w2 restart -A` (注意后面加 `-A`)启动生成新的更证书，再 [安装下根证书](https://avwo.github.io/whistle/webui/https.html) 即可。

> ** 在 iOS 上安装根证书时，需要先关闭[https 拦截](https://avwo.github.io/whistle/webui/https.html)，否则将显示安装失败。**

用来下载根证书、隐藏 `connect` 类型的请求、开启 Https 拦截功能。

![Https](https://avwo.github.io/whistle/img/https.gif)


### 安装根证书

如上图下载完根证书后点击 rootCA.crt 文件，弹出根证书安装对话框。

1. Windows：[http://program.most.gov.cn/cert/ca.htm](http://program.most.gov.cn/cert/ca.htm)
2. Mac：[mac 根证书怎么安装](http://zhidao.baidu.com/link?url=bQ8ZnDTxUIlqruQ56NYjBmwztWPlZtv9AIRazkoKeMsdpAq7mcwXOHQduRwmHV1M2hf143vqBxHzKb1tg0L03DJoj6XS109P8zBNF1E9uU_)

  Mac 安装证书后，需要手动信任证书，步骤如下：

  打开证书管理界面，找到带有 `whistle` 的字样的证书，如果有多个又不确定最新安装的是哪个，可以全部删除后重新安装

  ![img](https://ae01.alicdn.com/kf/HTB1ZtoBdYsTMeJjSszh763GCFXai.png)

  双击证书后，点击 `Trust` 左边展开选项，红色部分选择 `Always Trust` （总是信任），点击左上角关闭当前界面会要求输入密码；输入密码后可以看到证书上面红色的图标 `x` 不见了，到这一步说明完成证书安装。

  ![img](https://ae01.alicdn.com/kf/HTB1UWItd8USMeJjy1zk761WmpXaT.png)

3. **Firefox：菜单 > 首选项 > 高级 > 证书 > 证书机构 > 导入 -> 选中所有 checkbox -> 确定 **
4. Linux Chrome(Chromium): 参照这个[教程](http://www.richud.com/wiki/Ubuntu_chrome_browser_import_self_signed_certificate)
  * 地址栏输入 `chrome://chrome/settings/`
  * Show advanced Settings > Manage certificates > Authorities > Import
  * 选择证书后确认，重启浏览器
  * done

  ![ubuntu Chromium](https://cloud.githubusercontent.com/assets/16034964/20553721/9c3d1bda-b191-11e6-880f-9fd6976b95cc.png)
5. 手机

  **iOS**
  * 手机设置代理后，Safari 地址栏输入 `rootca.pro`，按提示安装证书（或者通过 `whistle` 控制台的二维码扫码安装，iOS 安装根证书需要到连接远程服务器进行验证，需要暂时把 **Https 拦截功能关掉 **）
  * iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="https://avwo.github.io/whistle/img/ios10.3_ca.PNG" width="320">

  **Android**
  * `whistle` 控制台二维码扫码安装，或者浏览器地址栏 `rootca.pro` 按提示安装
  * 部分浏览器不会自动识别 ca 证书，可以通过 Android Chrome 来完成安装

### 开启拦截 Https

图中的打开的对话框有两个 checkbox(** 在 iOS 安装根证书的时候，记得不要开启 ` Intercept HTTPS CONNECTs`，否则将无法安装成功 **)：

1. ` Hide HTTPS CONNECTs`：隐藏 `connect` 类型的请求
2. ` Intercept HTTPS CONNECTs`：开启 Https 拦截功能，只有勾上这个 checkbox 及装好根证书，whistle 才能看到 HTTPS、Websocket 的请求
3. 也可以通过配置来开启对部分请求的 Https 拦截功能

   www.test.com filter://intercept
	/alibaba-inc/ filter://intercept
   ​

4. 如果想过滤部分请求不启用 Https 拦截功能

   # 指定域名
	www.baidu.com  disable://intercept

	# 通过正则
	/baidu/ disable://intercept

	# 不支持通过路径的方式设置


# Online {#webui_online}

当前 whistle 是否在线及查看 whistle 服务的基本信息，包括：

- 运行的 Node 版本
- whistle 的端口号及 IP，方便移动端配置代理

![Online](https://avwo.github.io/whistle/img/online.gif)

# 常见应用 {#cases}

* [利用 whistle 调试移动端页面](http://imweb.io/topic/5981a34bf8b6c96352a59401)
* [利用 whistle 调试 WebSocket 和 Socket 请求](http://imweb.io/topic/5a11b1b8ef79bc941c30d91a)


# 用户反馈 {#feedback}

1. 有问题请直接提 issue: [New issue](https://github.com/avwo/whistle/issues/new)
2. 欢迎提 PR: [Pull requests](https://github.com/avwo/whistle/compare)
3. 有什么问题也可以通过 QQ 群反馈: 462558941


# 协议列表 {#rules}

* [**host** (设置 host)](#rules_host)
- [**rule** (设置响应规则)](#rules_rule)
  * [** 请求替换 **](#rules_rule_replace)
  * [**file** (替换本地文件)](#rules_rule_file)
  * [**rawfile** (替换本地 http 响应内容格式的文件)](#rules_rule_rawfile)
  * [**tpl** (替换本地目标文件，可用于模拟 jsonp 请求)](#rules_rule_tpl)
  * [** 自定义 **](#rules_rule_custom)
* [**weinre** (设置 weinre，调试手机页面)](#rules_weinre)
* [**log** (打印网页 js 错误或者调试信息)](#rules_log)
* [**proxy** (代理到其它 http 代理服务器)](#rules_proxy)
* [**socks** (代理到其它 socks 代理服务器)](#rules_socks)
* [**pac** (设置 pac 脚本)](#rules_pac)
* [**filter** (过滤规则，隐藏请求等)](#rules_filter)
* [**ignore** (忽略规则)](#rules_ignore)
* [**enable** (设置 intercept，隐藏请求等)](#rules_enable)
* [**disable** (禁用缓存、cookie 等)](#rules_disable)
* [**delete** (删除指定的字段)](#rules_delete)
* [**plugin** (通过插件获取请求状态及设置新规则)](#rules_plugin)
* [**dispatch** (动态修改请求 url 的参数)](#rules_dispatch)
* [**urlParams** (修改请求 url 的参数)](#rules_urlParams)
* [**urlReplace** (通过正则或字符串替换请求 url，类似 str.replace)](#rules_urlReplace)
* [**method** (修改请求方法)](#rules_method)
* [**statusCode** (直接响应)](#rules_statusCode)
* [**replaceStatus** (替换后台的响应状态码)](#rules_replaceStatus)
* [**hostname** (修改请求头部的 host 字段)](#rules_hostname)
* [**referer** (修改请求 referer)](#rules_referer)
* [**accept** (修改请求头的 accept)](#rules_accept)
* [**auth** (修改请求用户名密码)](#rules_auth)
* [**etag** (修改请求头部的 etag)](#rules_etag)
* [**ua** (修改请求 user-agent)](#rules_ua)
* [**cache** (修改缓存策略)](#rules_cache)
* [**redirect** (302 重定向)](#rules_redirect)
* [**location** (设置响应头部的 location 字段)](#rules_location)
* [**attachment** (设置下载头部)](#rules_attachment)
* [**forwardedFor** (修改请求头 x-forwarded-for)](#rules_forwardedFor)
* [**responseFor** (Network 上显示真实的服务器环境)](#rules_responseFor)
* [**params** (修改请求参数)](#rules_params)
* [**reqScript** (批量设置请求规则或通过脚本动态获取规则)](#rules_reqScript.md)
* [**resScript** (批量设置响应规则或通过脚本动态获取规则)](#rules_resScript.md)
* [**reqDelay** (延迟请求)](#rules_reqDelay)
* [**resDelay** (延迟响应)](#rules_resDelay)
* [**reqSpeed** (限制请求速度)](#rules_reqSpeed)
* [**resSpeed** (限制响应速度)](#rules_resSpeed)
* [**reqHeaders** (修改请求头)](#rules_reqHeaders)
* [**resHeaders** (修改响应头)](#rules_resHeaders)
* [**reqType** (修改请求类型)](#rules_reqType)
* [**resType** (修改响应类型)](#rules_resType)
* [**reqCharset** (修改请求的编码)](#rules_reqCharset)
* [**resCharset** (修改响应的编码)](#rules_resCharset)
* [**reqCookies** (修改请求 cookies)](#rules_reqCookies)
* [**resCookies** (修改响应 cookies)](#rules_resCookies)
* [**reqCors** (修改请求 cors)](#rules_reqCors)
* [**resCors** (修改响应 cors)](#rules_resCors)
* [**reqPrepend** (往请求内容前面添加数据)](#rules_reqPrepend)
* [**resPrepend** (往响应内容前面添加数据)](#rules_resPrepend)
* [**reqBody** (替换请求内容)](#rules_reqBody)
* [**resBody** (替换响应内容)](#rules_resBody)
* [**reqAppend** (往请求内容后面追加数据)](#rules_reqAppend)
* [**resAppend** (往响应内容后面追加数据)](#rules_resAppend)
* [**reqReplace** (通过正则或字符串替换请求文本内容，类似 str.replace)](#rules_reqReplace)
* [**resReplace** (通过正则或字符串替换响应文本内容，类似 str.replace)](#rules_resReplace)
* [**htmlPrepend**(往响应为 html 的内容前面添加数据)](#rules_htmlPrepend.md)
* [**cssPrepend** (往响应为 html 或 css 的内容前面添加数据)](#rules_cssPrepend.md)
* [**jsPrepend** (往响应为 html 或 js 的内容前面添加数据)](#rules_jsPrepend.md)
* [**htmlBody**(替换响应为 html 的内容)](#rules_htmlBody.md)
* [**cssBody** (替换响应为 html 或 css 的内容)](#rules_cssBody.md)
* [**jsBody** (替换响应为 html 或 js 的内容)](#rules_jsBody.md)
* [**htmlAppend**(往响应为 html 的内容前面数据)](#rules_htmlAppend.md)
* [**cssAppend** (往响应为 html 或 css 的内容后面追加数据)](#rules_cssAppend.md)
* [jsAppend** (往响应为 html 或 js 的内容后面追加数据)](#rules_jsAppend.md)
* [**req** (修改请求属性)](#rules_req)
* [**res** (修改响应属性)](#rules_res)
* [**reqWrite** (将请求内容写入指定的文件)](#rules_reqWrite)
* [**resWrite** (将响应内容写入指定的文件)](#rules_resWrite)
* [**reqWriteRaw** (将请求的完整内容写入指定的文件)](#rules_reqWriteRaw)
* [**resWriteRaw** (将响应的完整内容写入指定的文件)](#rules_resWriteRaw)
* [**exportsUrl** (把请求的 url 列表按顺序导出到指定文件)](#rules_exportsUrl)
* [**exports** (导出请求数据到指定文件)](#rules_exports)


# host {#rules_host}

whistle 不仅完全兼容操作系统的 hosts 配置模式，也支持域名、路径、正则三种匹配方式，而且支持配置端口号，配置模式：

1. 传统的 hosts 配置模式：

		ip pattern

		# 组合模式
		ip pattern1 pattern2 patternN

	* 其中，pattern 可以为域名、路径、正则，具体参考 [匹配方式](#rules_pattern)*

2. whistle 还支持以下配置模式：

		ip pattern
		pattern host://ip
		host://ip pattern

		# 带端口号，whistle 会把请求转发的指定 ip 和端口上
		pattern ip:port
		ip:port pattern

		# 类似 DNS 的 cname
		pattern host://hostname
		pattern host://hostname:port
		host://hostname:port pattern

		# 组合模式
		pattern ip1 operator-uri1 operator-uriN
		host://ip:port pattern1 pattern2 patternN

	* 其中，pattern 可以为域名、路径、正则，具体参考 [匹配方式](#rules_rules_pattern)*

### 例子：

	# 传统 hosts 配置
	127.0.0.1 www.example.com # 等价于： www.example.com  127.0.0.1
	127.0.0.1 a.example.com b.example.com c.example.com

	# 支持带端口
	127.0.0.1:8080 www.example.com # 等价于： www.example.com  127.0.0.1：8080
	127.0.0.1:8080 a.example.com b.example.com c.example.com

	# 支持通过域名获取 host，类似 DNS 的 cname
	host://www.qq.com:8080 www.example.com # 等价于： www.example.com  host://www.qq.com:8080
	host://www.qq.com:8080 a.example.com b.example.com c.example.com

	# 支持通过正则表达式匹配
	127.0.0.1:8080 /example\.com/i # 等价于： /example\.com/i  127.0.0.1：8080
	127.0.0.1:8080 /example\.com/ /test\.com/

	# 支持路径匹配
	127.0.0.1:8080 example.com/test # 等价于： example.com/test 127.0.0.1：8080
	127.0.0.1:8080 http://example.com:5555/index.html www.example.com:6666 https://www.test.com/test

	# 支持精确匹配
	127.0.0.1:8080 $example.com/test # 等价于： $example.com/test 127.0.0.1：8080
	127.0.0.1:8080 $http://example.com:5555/index.html $www.example.com:6666 $https://www.test.com/test


# 响应规则列表 {#rules_rule}

* [** 请求替换 **](#rules_rule_replace)
* [**file** (替换本地文件)](#rules_rule_file)
* [**xfile** (替换本地文件，如果本地文件不存在，则请求线上)](#rules_rule_xfile)
* [**rawfile** (替换本地 http 响应内容格式的文件)](#rules_rule_rawfile)
* [**xrawfile** (替换本地 http 响应内容格式的文件，如果本地文件不存在，则请求线上)](#rules_rule_rawfile)
* [**tpl** (替换本地目标文件，可用于模拟 jsonp 请求)](#rules_rule_tpl)
* [**xtpl** (同上，与 xfile 类似)](#rules_rule_xtpl)
* [** 自定义 **](#rules_rule_custom)


# 自定义规则 {#rules_rule_custom}

whistle 提供了插件的方式扩展协议，具体参考：[插件开发](#rules_rule_plugins)


# file (xfile) {#rules_rule_file}

__xfile 功能同 file 一样，xfile 和 file 的唯一区别是 file 找不到对应文件返回 404，而 xfile 则是继续请求线上资源。__

替换本地目录或文件，配置模式：

	pattern file://filepath
	# 也可以匹配一个文件或目录路径列表，whistle 会依次查找直到找到存在的文件
	pattern file://path1|path2|pathN

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件，pattern 参见[匹配方式](#rules_rule_pattern)，更多模式请参考[配置模式](#rules_rule_mode)。

如果 pattern 为域名或路径，whistle 会自动根据请求 url 后面剩余的路径跟 filepath 自动补全，即：

	www.test.com/abc file://filpath

则请求 `http://www.test.com/abc/index.html` 会替换本地的 `filepath/index.html` 文件，如果不想自动补全可以使用操作符 `<>`：

	www.test.com/abc file://<filepath>

这样所有 `www.test.com/abc` 的子路径都会被 `filepath` 替换掉，这种情况也可以用正则匹配解决。


例子：

	www.ifeng.com file:///User/xxx/test|/User/xxx/test/index.html
	# Windows 的路径分隔符同时支持 \ 和 /
	www.ifeng.com file://D:/xxx/test|D:/xxx/test/index.html
	www.ifeng.com file://D:\xxx\test|D:\xxx\test\index.html

所有 www.ifeng.com 的请求都会先到目录或文件 `/User/xxx/test`，没有匹配的文件再到 `/User/xxx/test/index.html`


# rawfile (xrawfile) {#rules_rule_rawfile}

__xrawfile 功能同 rawfile 一样，和 rawfile 的唯一区别是 rawfile 找不到对应文件返回 404，而 xrawfile 则是继续请求线上资源。__

替换本地 (目录下) 的 http 格式的文件 (可以与[resWriteRaw](#rules_rule_rules_rule_resWriteRaw) 配合使用)，请求会自动补全路径，配置模式：

	pattern rawfile://filepath
	# 也可以匹配一个文件或目录路径列表，whistle 会依次查找直到找到存在的文件
	pattern rawfile://path1|path2|pathN

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件，pattern 参见[匹配方式](#rules_rule_pattern)，更多模式请参考[配置模式](#rules_rule_mode)。

http 格式文件参考: [http 内容格式](http://www.cnblogs.com/kissdodog/archive/2013/01/11/2856335.html)

例子:

	www.ifeng.com rawfile://{test-rawfile}

[Values](http://local.whistlejs.com/#values)中的分组 `test-rawfile`:

	HTTP/1.1 200 OK
	content-type: text/plain

	test


# 请求替换 {#rules_rule_replace}

把请求替换成请求其它 url，配置模式：

	pattern http://host:port/xxx
	pattern https://host:port/xxx

	# 自动补充协议(与请求的协议一样)
	pattern host:port/xxx

其中，pattern 参见[匹配方式](#rules_rule_pattern)，更多模式请参考[配置模式](#rules_rule_mode)。

例子：

把 [www.ifeng.com](http://www.ifeng.com/) 域名下的请求全部替换成 www.aliexpress.com 的请求：

		www.ifeng.com www.aliexpress.com

用 [http://www.ifeng.com](http://www.ifeng.com/) 访问 HTTPS 的[https://www.baidu.com](https://www.baidu.com/)

		http://www.ifeng.com https://www.baidu.com


# tpl (xtpl) {#rules_rule_tpl}

__xtpl 功能同 tpl 一样，和 tpl 的唯一区别是 tpl 找不到对应文件返回 404，而 xtpl 则是继续请求线上资源。__


tpl 基本功能跟 [file](#rules_rule_rules_rule_file) 一样可以做本地替换，但 tpl 内置了一个简单的模板引擎，可以把文件内容里面 `{name}` 替换请求参数对应的字段(如果不存在对应的自动则不会进行替换)，一般可用于 mock jsonp 的请求。

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


# xfile {#rules_rule_xfile}

__xfile 功能同 file 一样，xfile 和 file 的唯一区别是 file 找不到对应文件返回 404，而 xfile 则是继续请求线上资源。__


用法参考 [file](#rules_rule_rules_rule_file)


# xtpl {#rules_rule_xtpl}

__xtpl 功能同 tpl 一样，和 tpl 的唯一区别是 tpl 找不到对应文件返回 404，而 xtpl 则是继续请求线上资源。__


用法参考 [tpl](#rules_rule_rules_rule_tpl)


# accept {#rules_accept}

修改请求头的 accept 字段，accept 字段主要告诉服务器该请求可以接受什么类型的数据，配置模式：

	pattern accept://mime-type

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

只接受图片类型的数据

	www.test.com accept://image/*


# attachment {#rules_attachment}

设置响应头字段，让响应变成可以直接下载，配置模式：

	pattern attachment://filename

filname 指定下载文件保存的名称，如果 filename 为空，则会自动获取 url 对应的文件名称，如果 url 没有对应的文件名称，则默认为 `index.html`

例子：

	www.ifeng.com attachment://ifeng.html

访问 [www.ifeng.com](http://www.ifeng.com/) 时会自动下载该页面。


# auth {#rules_auth}

修改请求头的 `authorization` 字段，这个字段是网页 401 弹出的输入框中输入用户名和密码的 Base64 编码，配置模式:

	pattern auth://username:password

	# 或者采用 json 格式
	pattern auth://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	username: xxx
	password: ooo

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com auth://test:123


# cache {#rules_cache}

设置响应的缓存头，配置模式：

	pattern cache://maxAge

maxAge 为缓存的秒数，也可以代表一些关键字: `no`、`no-cache`、`no-store`，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	# 去除缓存
	www.ifeng.com cache://no

	# 设置一分钟的缓存
	www.ifeng.com cache://60


如果如果后台返回 304 设置这个字段没有用，要防止后台返回 `304`，需要用 [disable](#rules_rules_disable)://cache。


# css {#rules_css}
> `v1.8.0` 及以后的版本用 [cssAppend](#rules_rules_cssAppend) 代替

往 content-type 为 html 或 css 的响应内容后面追加数据，如果是 html，则会自动加上 style 标签在追加到响应内容，如果是 css，则会自动追加到文本后面，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern css://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com css://{test.css}

test.css:

	html, body {background: red!important;}


# cssAppend {#rules_cssAppend}

往 content-type 为 html 或 css 的响应内容后面追加数据，如果是 html，则会自动加上 style 标签在追加到响应内容，如果是 css，则会自动追加到文本后面，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern cssAppend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com cssAppend://{test.css}

test.css:

	html, body {background: red!important;}


# cssBody {#rules_cssBody}

替换 content-type 为 html 或 css 的响应内容，如果是 html，则会自动加上 style 标签在替换响应内容，如果是 css，则替换整个 css 文件，这个与 [resBody](#rules_rules_resBody) 的区别是 [resBody](#rules_rules_resBody) 不区分类型，对所有匹配的响应都会执行替换数据，配置模式：

	pattern cssBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com cssBody://{test.css}

test.css:

	html, body {background: red!important;}


# cssPrepend {#rules_cssPrepend}

往 content-type 为 html 或 css 的响应内容前面追加数据，如果是 html，则会自动加上 style 标签再追加到响应内容前面，如果是 css，则会自动追加到文本前面，这个与 [resPrepend](#rules_rules_resPrepend) 的区别是 [resPrepend](#rules_rules_resPrepend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern cssPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com cssPrepend://{test.css}

test.css:

	html, body {background: red!important;}


# delete {#rules_delete}

删除指定的请求响应头字段，也可以通过 [reqHeaders](#rules_rules_reqHeaders)、[resHeaders](#rules_rules_resHeaders) 把字段设置为空字符串，配置模式：

	pattern delete://req.headers.xxx|req.headers.x22|res.headers.yyy|headers.zzz

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

其中：

1. `req.headers.xxx`: 删除 req.headers 的 xxx 字段
2. `res.headers.xxx`: 删除 res.headers 的 xxx 字段
3. `headers.xxx`: 删除 res.headers&res.headers 的 xxx 字段


# disable {#rules_disable}

用来禁用 cache、cookie、ua、referer、csp、timeout、301、intercept、dnsCache、keepAlive 等 HTTP(s) 请求的一些基本功能，也可以用来阻止通过 HTTPS 代理的请求 `filter://tunnel`。

配置模式：

	pattern disable://operator1|operator2|operatorN

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：


	# 禁用请求的缓存，只要经过代理且匹配到的请求都不会使用缓存
	# 跟 cache 协议的区别是，cache 只是用来设置响应的缓存头
	wwww.test.com disable://cache

	# 禁用请求和响应的 cookie
	wwww.test.com disable://cookie # 也可以写成复数形式 cookies

	# 只禁用请求的 cookie
	wwww.test.com disable://reqCookie # 也可以写成复数形式 reqCookies

	# 只禁用响应的 cookie
	wwww.test.com disable://resCookie # 也可以写成复数形式 reqCookies

	# 删除 ua
	wwww.test.com disable://ua

	# 删除 referer
	wwww.test.com disable://referer

	# 删除 csp 策略
	wwww.test.com disable://csp

	# 禁用 timeout，默认情况下 whistle 对每个请求如果 36s 内没有发生数据传输，会认为请求超时
	wwww.test.com disable://timeout

	# 把 301 转成 302，防止 cache
	wwww.test.com disable://301

	# 禁用 https 拦截
	wwww.test.com disable://intercept

	# 不缓存远程的 dns(通过 whistle 配置的 host 是不会缓存)，主要用于测试网页的极端情况的加载速度
	wwww.test.com disable://dnsCache

	# 禁用代理服务器请求链接复用
	wwww.test.com disable://keepAlive

	# 删除请求头 `x-requested-with`
	wwww.test.com disable://ajax

	# 也可以同时禁用多个
	www.example.com disable://cache|cookie|ua|referer|csp|timeout|301|intercept|dnsCache|keepAlive


# dispatch {#rules_dispatch}

有时需要根据UA或其它请求头信息返回不同的数据，whistle用sandbox执行`dispatch`传人进来的脚本，`dispatch`关联的脚本在全局属性可以获取以下信息：

	url: //请求url
	method: //请求方法
	httpVersion: //请求http版本
	ip: //请求客户端的ip
	headers: //请求的头部
	params: //请求参数，可以动态修改

并通过`params`这个请求参数对象修改或添加请求参数，改变url达到匹配不同规则的效果：

	var ua = headers['user-agent'];
	if (/iphone/i.test(ua)) {
	    params.test=1;
	} else if (/android/i.test(ua)) {
	    params.test=2;
	} else {
	    params.test=3;
	}

配置模式：

	pattern dispatch://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地js文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com dispatch://{dispatch.js}

dispatch.js:

	var ua = headers['user-agent'];
	if (/iphone/i.test(ua)) {
	    params.test=1;
	} else if (/android/i.test(ua)) {
	    params.test=2;
	} else {
	    params.test=3;
	}

[www.ifeng.com](http://www.ifeng.com/)的请求都会在url加上请求参数`test=xxx`


# enable {#rules_enable}

通过配置开启指定的设置(https 拦截、隐藏请求)，配置模式(v1.2.5 及以上版本支持)：

	pattern enable://https|intercept|hide|abort

其中，`https` 或 `intercept` 表示拦截 pattern 匹配的 tunnel 请求 (如果是 https 或 wss 请求需要安装 whistle 的根证书：[点击这里](#rules_webui_https)，拦截后可以查看 https 请求的具体内容)；`hide` 表示隐藏 pattern 匹配的所有请求，将不显示在[Network](#rules_webui_network) 上；通过 `|` 可以同时设置多个操作。

例子：

	# 拦截 url 里面有 baidu 的 https 请求
	/baidu/ enable://intercept

	# 拦截域名 www.google.com 下的所有 https 请求，且不在 Network 上显示
	www.google.com enable://intercept|hide

	# abort 掉请求(v1.5.17+)
	www.xiaoying.com enable://abort


# etag {#rules_etag}

修改请求头的 etag 字段，配置模式：

	pattern etag://etagValue

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	# 删除 etag
	www.ifeng.com etag://

	# etag 修改为 xxx
	www.ifeng.com etag://xxx


# exports {#rules_exports}

用于把请求的一些信息导出到指定文件 (如果该文件不存在，则会自动创建)，每个请会导出以下信息:

	{
	    startTime: '请求的开始时间',
	    dnsTime: 'dns 结束时间',
	    requestTime: '请求结束时间',
	    responseTime: '开始响应的时间',
	    endTime: '响应结束的时间',
	    url: '请求的 url',
	    realUrl: '实际请求的 url(一般设置了替换规则，才会有 realUrl，否则不会显示该字段)',
	    method: '请求使用的方法',
	    httpVersion: 'http 版本号',
	    clientIp: '用户 ip',
	    hostIp: '服务器 ip',
	    reqError: '是否请求阶段出错',
	    reqSize: '请求内容的长度',
	    reqHeaders: '请求头',
	    reqTrailers: '请求的 trailers',
	    statusCode: '响应状态码',
	    resError: '是否在响应阶段出错',
	    resSize: '响应内容的长度',
	    resHeaders: '响应头',
	    resTrailers: '响应的 trailers',
	    rules: '匹配到的规则'
	}

配置模式：

	pattern exports://filepath

filepath 指本地文件路径，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

导出所有请求信息到指定文件:

	/./ exports:///User/xxx/exports.txt


# exportsUrl {#rules_exportsUrl}

用于把请求的完整 url 列表按顺序导出到指定文件 (如果该文件不存在，则会自动创建)，配置模式：

	pattern exportsUrl://filepath

filepath 指本地文件路径，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

导出所有请求 url 到指定文件:

	/./ exportsUrl:///User/xxx/exports.txt


# filter(=[ignore](#rules_rules_ignore) + [enable](#rules_rules_enable)) {#rules_filter}

用于忽略指定配置的规则：

	pattern filter://rule|proxy|pac

可以同时设置多个规则 [协议列表](#rules) 里面的规则，其中 rule 包含[file、tpl 等](#rules_rule)；

也可以用来开启拦截 https：

	pattern filter://https

也可以用来隐藏请求：

	pattern filter://hide

同时配置多种过滤规则的配置模式：

	pattern filetr://operator1|operator2|operatorN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

开启拦截 [www.baidu.com](http://www.baidu.com/) 的 HTTPS 及去除 [rule](#rules_rules_rule) 配置

	www.baidu.com filter://https|rule
	www.ifeng.com filter://hide|proxy|rule

开启拦截 HTTPS 也可以通过界面上方的 Https 按钮来启用，filter 提供了一种可配置的方式，`filter://hide` 可以让 www.ifeng.com 的请求不在界面上显示，这个与界面上的 Filter 设置效果相反，可以配合使用。


# forwardedFor {#rules_forwardedFor}

修改请求头的 `x-forwarded-for` 字段 (`whistle >= v1.6.1`)，配置模式：

	pattern forwardedFor://ip

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	# 修改 www.ifeng.com 请求头的 `x-forwarded-for` 字段为 1.1.1.1
	www.ifeng.com forwardedFor://1.1.1.1


# hostname {#rules_hostname}

修改请求头的 host 字段，后台 server 会根据请求头的 host 字段来判断请的域名，一般情况下无需修改采用默认的即可，但在调试阶段可能会涉及到 host 里面有端口的问题，则可以用 hostname 这个协议来去除端口 (最好的方式还是采用配置带端口号的 [host](#rules_rules_host))。

配置模式:

	pattern hostname://newHostname

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.test.com:8888 hostname://www.test.com

去掉 www.test.com:8888 所有请求头部 host 字段的端口号。


# html {#rules_html}

> `v1.8.0` 及以后使用 [jsAppend](#rules_rules_jsAppend) 代替

往 content-type 为 html 的响应内容后面追加数据，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern html://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com html://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>


# htmlAppend {#rules_htmlAppend}

往 content-type 为 html 的响应内容后面追加数据，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern htmlAppend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com htmlAppend://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>


# htmlBody {#rules_htmlBody}

替换 content-type 为 html 的响应内容，这个与 [resBody](#rules_rules_resBody) 的区别是 [resBody](#rules_rules_resBody) 不区分类型，对所有匹配的响应都会替换，配置模式：

	pattern htmlBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com htmlBody://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>


# htmlPrepend {#rules_htmlPrepend}

往 content-type 为 html 的响应内容前面添加数据，这个与 [resPrepend](#rules_rules_resPrepend) 的区别是 [resPrepend](#rules_rules_resPrepend) 不区分类型，对所有匹配的响应都会在前面添加指定的数据，配置模式：

	pattern htmlPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com htmlPrepend://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>


# ignore {#rules_ignore}

忽略 (过滤) 指定的规则设置，配置模式(v1.2.5 及以上版本支持)：

	pattern ignore://protocol1|protocol2|protocolN

其中，`protocol1`，...，`protocolN` 对应 [协议列表](#rules) 里面的协议，`|` 为分隔符用于同时设置忽略 (过滤) 多个规则。

例子：

	# 忽略 socks 协议及指定插件
	www.baidu.com socks://127.0.0.1:1080 whistle.test://xxx
	www.baidu.com ignore://socks|whistle.test

	# 忽略 proxy 协议及指定插件
	/google/ proxy://127.0.0.1:8888 implugin://xxx
	www.google.com enable://intercept
	www.google.com ignore://proxy|implugin|enable

	# 忽略配置的 host
	www.qq.com 127.0.0.1
	www.qq.com ignore://host

  # 忽略子路径的 host
  www.xxx.com 127.0.0.1
  www.xxx.com/api ignore://host   # www.xxx.com/api 将不走 127.0.0.1


# js {#rules_js}

> `v1.8.0` 及以后的版本用 [jsAppend](#rules_rules_jsAppend) 代替

往 content-type 为 html 或 js 的响应内容后面追加数据，如果是 html，则会自动加上 script 标签在追加到响应内容，如果是 js，则会自动追加到 js 文本后面，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern js://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com js://{test.js}

test.js:

	alert(2);


# js {#rules_jsAppend}

往 content-type 为 html 或 js 的响应内容后面追加数据，如果是 html，则会自动加上 script 标签在追加到响应内容，如果是 js，则会自动追加到 js 文本后面，这个与 [resAppend](#rules_rules_resAppend) 的区别是 [resAppend](#rules_rules_resAppend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern js://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com js://{test.js}

test.js:

	alert(2);


# jsBody {#rules_jsBody}

替换往 content-type 为 html 或 js 的响应内容，如果是 html，则会自动加上 script 标签再替换响应内容，如果是 js，则会自动替换整个 js 文件，这个与 [resBody](#rules_rules_resBody) 的区别是 [resAppend](#rules_rules_resBody) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern jsBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com jsBody://{test.js}

test.js:

	alert(2);


# jsPrepend {#rules_jsPrepend}

往 content-type 为 html 或 js 的响应内容前面添加数据，如果是 html，则会自动加上 script 标签再添加到响应内容前面，如果是 js，则会自动添加到响应内容前面，这个与 [jsPrepend](#rules_rules_jsPrepend) 的区别是 [jsPrepend](#rules_rules_jsPrepend) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern jsPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com jsPrepend://{test.js}

test.js:

	alert(2);


# log {#rules_log}

可以用来自动监控 html 页面或 js 文件出现的错误及显示 console.xxx 打印出来的信息，这些错误及日志会自动打印在 whistle 界面的 log 平台，还可以自动嵌入自定义的脚本调试页面。

支持的 console 方法有(支持所有浏览器)： console.log, console.debug, console.info, console.warn. console.error, console.fatal。

配置模式：

	pattern log://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件的 js 脚本(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com log://{test.js}

[Values](http://local.whistlejs.com/#values)里面的 `test.js` 分组内容：

	console.log(1, 2, 3, {abc: 123});


# method {#rules_method}

修改请求方法，配置模式：

	pattern method://newMethod

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.ifeng.com method://post


# pac {#rules_pac}

设置 pac 脚本，配置模式：

	pattern pac://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件 (如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等) 或 http(s)链接，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	/./ pac://https://raw.githubusercontent.com/imweb/node-pac/master/test/scripts/normal.pac


# params {#rules_params}

修改请求参数或表单参数，配置模式：

	pattern params://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	field1: value1
	field2: value2
	filedN: valueN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

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

括号的写法见：[Rules 的特殊操作符({}、()、<>)](#rules_webui_rules)


# plugin {#rules_plugin}

从 [插件开发](#rules_plugins) 里面可知，插件里面涉及 `uiServer`，`statusServer`，`rulesServer`，`server`，`resRulesServer` 共 5 个内部功能不同的 server，这几个 server 都是可选的；如果存在，插件会把匹配的请求按给定方式传给对应的 server，并根据 server 响应内容做相应的处理，如何把请求转发到插件的各个 server？一种方式是直接根据插件的名称设置匹配，比如插件 `whistle.abc`：

	pattern abc://value

这样所有匹配 `pattern` 的请求都会访问插件里面的内置 server，这种配置方式比较简单直接，且默认会把请求转发给其中 `server` 处理(除非在 `rulesServer` 里面设置了[filter://rule](#rules_rules_filter))，这种设置方式只能满足要么插件做转发，要么通过 `rulesServer` 动态设置的规则来做处理。

有些情况，我们需要动态判断请求是否要有插件来做转发，还是直接根据用户设置的 [rule](#rules_rules_rule) 来处理，这种情况需要用到 plugin 这个协议：

	pattern plugin://name
	pattern plugin://name(value)
	pattern plugin://name://value

plugin 支持上述 3 种配置模式(位置可以调换)，匹配规则的请求默认只会请求 `statusServer`，`rulesServer`，`resRulesServer`，用户可以在这 3 个 server 里面获取请求响应信息或动态设置新规则等等。


# proxy {#rules_proxy}

设置 http 代理，配置模式：

	pattern proxy://ip:port

	# 加用户名密码
	pattern proxy://username:password@ip:port

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。


例子：

把所有请求代理到 `127.0.0.1:8888` 的代理服务器：

	/./ proxy://127.0.0.1:8888
	www.facebook.com proxy://test:123@127.0.0.1:8888


# redirect {#rules_redirect}

设置 302 调整，配置模式：

	pattern redirect://jumpUrl

jumpUrl 为请求要 302 跳转的目标 url，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。


例子：

	www.ifeng.com redirect://http://www.aliexpress.com/


# referer {#rules_referer}

修改请求头的 referer 字段，有些服务器会校验请求头的 referer 字段，这个协议可以用来绕过这个检测或者测试后台的功能，配置模式：

	pattern referer://url

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

如果我们在 www.test.com 域名的页面中发 www.aliexpress.com 的请求，则请求头的 referer 为 www.test.com 域名下的 url 或为空，这样可能请求到后台会返回 403，可以这么修改 referer：

	www.aliexpress.com referer://http://www.aliexpress.com

把 www.aliexpress.com 域名下的请求都加上 `http://www.aliexpress.com` 这个 referer。


# replaceStatus {#rules_replaceStatus}

替换响应的状态码 (状态码范围 100~999)，这个与[statusCode](#rules_rules_statusCode) 的区别是，replaceStatus 是请求响应后再修改状态码，而后者的请求不会发出去，设置完状态码直接返回，配置模式：

	pattern replaceStatus://code

其中：code >= 100 && code <= 999，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。


例子：

	www.ifeng.com replaceStatus://500


# req {#rules_req}

> 不推荐使用该协议，为方便使用，whistle 已将此协议的功能拆分成多个协议，具体参见其它协议

修改请求的方法、请求头、请求内容、请求速度等等，配置模式：

	pattern req://params

params 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，内容为:

	{
	    "method": "post", // 修改请求方法
	    "headers": { // 修改请求头
	        "referer": "http://www.example.com/xxx"
	    },
	    "top": "preappend body", // 请求内容前面添加的文本
	    "prepend": "/User/xxx/top.txt", // 请求内容前面添加的文件路径
	    "body": "request body", // 替换请求内容的文本
	    "replace": "/User/xxx/body.txt", // 替换请求内容的文件路径
	    "bottom": "append body", // 追加到请求内容后面的文本
	    "append": "/User/xxx/bottom.txt", // 追加到请求内容后面的文件路径
	    "delay": 6000, // 延迟请求的毫秒数
	    "speed": 20, // 请求速度(单位：kb/s，千比特 / 每秒)
	    "timeout": 36000, // 超时时间
	    "charset": "utf8" // 请求内容编码
	}

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

把 [www.ifeng.com](http://www.ifeng.com/) 改成 post 请求，及 referer 改成 `http://wproxy.org`

	www.ifeng.com req://{test-req}

Values 的 `test-req`:

	{
	    "method": "post",
	    "headers": {
	        "referer": "http://wproxy.org"
	    }
    }


# reqAppend {#rules_reqAppend}

把指定的内容追加到请求内容后面(GET 等请求没有内容无法追加)，配置模式：

	pattern reqAppend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Append body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com method://post reqAppend://{test-reqAppend.html}


test-reqAppend.html:

	Append body


# reqBody {#rules_reqBody}

把指定的内容替换请求内容(GET 等请求没有内容没有替换一说)，配置模式：

	pattern reqBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Body body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com method://post reqBody://{test-reqBody.html}


test-reqBody.html:

	Body body


# reqCharset {#rules_reqCharset}

修改请求头 `content-type` 的 charset，配置模式：

	pattern reqCharset://charset

charset 可以为 `utf8`、`gbk` 等等字符编码，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)

例子：

	www.ifeng.com reqCharset://utf8


# reqCookies {#rules_reqCookies}

修改请求的 cookie，配置模式：

	pattern reqCookies://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	key1: value1
	key2: value2
	keyN: valueN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com reqCookies://{test-reqCookies.json}


test-reqCookies.json:

	test: 123
	key: value


# reqCors {#rules_reqCors}

修改请求的[cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，配置模式：

	pattern reqCors://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	origin: *
	method: POST
	headers: x-test

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com reqCors://{test-reqCors.json}


test-reqCors.json:

	origin: *
	method: POST
	headers: x-test


# reqDelay {#rules_reqDelay}

设置延迟请求的时间 (单位：毫秒)，配置模式：

	pattern reqDelay://timeMS

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.ifeng.com reqDelay://3000


# reqHeaders {#rules_reqHeaders}

修改请求头，配置模式：

	pattern reqHeaders://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	x-test1: value1
	x-test2: value2
	x-testN: valueN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com reqHeaders://{test-reqHeaders.json}


test-reqHeaders.json:

	x-test1: value1
	x-test2: value2
	x-testN: valueN


# reqPrepend {#rules_reqPrepend}

把指定的内容添加到请求内容前面(GET 等请求没有内容无法添加)，配置模式：

	pattern reqPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Prepend body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com method://post reqPrepend://{test-reqPrepend.html}


test-reqPrepend.html:

	Prepend body


# reqReplace {#rules_reqReplace}

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换请求文本内容请求的 content-type 必须为表单 (application/x-www-form-urlencoded) 或其它文本类型：urlencoded、html、json、xml、text 等)，配置模式：

	pattern reqReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com reqReplace://{test-reqReplace.json}


test-reqReplace.json:

	/user=([^&])/ig: user=$1$1
	str: replacement


# reqScript {#rules_reqScript}

给匹配的请求批量设置规则，或者通过脚本动态设置规则，配置模式：

	pattern reqScript://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地js文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

filepath指定的文本可以为一组规则列表，也可以一个js脚本通过判断url、method、clientIp、headers, body动态设置规则：

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
3. `ip(clientIp)`: 客户端ip
4. `headers`: 请求头部
5. `body`: 请求内容，如果没有请求内容为空字符串(`''`)，如果请求内容大于16k，可能只能获取请求前面16k长度的内容(whistle >= v1.5.18)
6. `rules`: 存放新规则的数组
7. `values`: 存放临时values的对象(v1.6.7开始支持)
8. `render(tplStr, data)`: 内置[microTemplate](https://johnresig.com/blog/javascript-micro-templating/)，方便通过模板渲染数据(v1.7.1开始支持)
9. `getValue(key)`: 获取Values中对应key的值(v1.7.1开始支持)
10. `parseUrl`: 同 `url.parse`(v1.7.1开始支持)
11. `parseQuery`: 同 `querystring.parse`(v1.7.1开始支持)


用该方法可以解决此问题[#19](https://github.com/avwo/whistle/issues/19)，也可以用来做ip_hash等，具体用法看下面的例子


例子：

设置静态规则列表

	www.ifeng.com reqScript://{reqScript.txt}

reqScript.txt:

	# 第一行没有这个注释符号，whistle会认为是一个脚本
	http://www.ifeng.com/index.html redirect://http://www.ifeng.com/?test
	www.ifeng.com resType://text

通过脚本设置规则列表

	www.ifeng.com reqScript://{reqScript.js}

reqScript.js:

	if (/index\.html/i.test(url)) {
		rules.push('/./ redirect://http://www.ifeng.com/?test.js');
	}

	if (/html/.test(headers.accept)) {
		rules.push('/./ resType://text');
	}
	// 如果请求内容里面有prefix字段，则作为新url的前缀
	if (/(?:^|&)prefix=([^&]+)/.test(body)) {
		var prefix = RegExp.$1;
		var index = url.indexOf('://') + 3;
		var schema = url.substring(0, index);
		var newUrl = schema + prefix + '.' + url.substring(index);
		rules.push(url + ' ' + newUrl);
		// rules.push('/./ ' + newUrl);
	}


# reqSpeed {#rules_reqSpeed}

设置请求速度 (单位：kb/s，千比特 / 每秒)，配置模式：

	pattern reqSpeed://kbs

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.ifeng.com reqSpeed://3


# reqType {#rules_reqType}

修改请求头的 `content-type`，配置模式：

	pattern reqType://mimeType

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)，mimeType 为新的 `content-type`，如：`text/plain`、`text/html`、`image/png` 等等，还有一些关键字，whistle 会自动把它转成对应的 type：

	urlencoded: application/x-www-form-urlencoded
	form: application/x-www-form-urlencoded
	json: application/json
	xml: text/xml
	text: text/plain
	upload: multipart/form-data
	multipart: multipart/form-data
	defaultType: application/octet-stream

例子：

	www.ifeng.com reqType://text


# reqWrite {#rules_reqWrite}

将请求的内容 (如果请求方法允许携带内容) 写入的指定的文件夹或文件；whistle 会根据请求的 url 和配置自动拼接成路径，且 whistle 不会覆盖已存在的文件，配置模式：

	pattern reqWrite://filepath

filepath 为本地目录或文件，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	# 匹配 http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ reqWrite:///User/test/index.html
	www.ifeng.com reqWrite:///User/test


# reqWriteRaw {#rules_reqWriteRaw}

将请求的完整内容 (包括请求方法、路径、协议、请求头、内容) 写入的指定的文件夹或文件；whistle 会根据请求的 url 和配置自动拼接成路径，且 whistle 不会覆盖已存在的文件，配置模式：

	pattern reqWriteRaw://filepath

filepath 为本地目录或文件，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	# 匹配 http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ reqWriteRaw:///User/test/index.html
	www.ifeng.com reqWriteRaw:///User/test


# res {#rules_res}

> 不推荐使用该协议，为方便使用，whistle 已将此协议的功能拆分成多个协议，具体参见其它协议

修改响应头、响应内容、响应速度等等，配置模式：

	pattern res://params

params 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，内容为:

	{
	    "headers": { // 修改响应头部
	        "content-type": "text/plain; charset=utf8"
	    },
	    "top": "preappend body", // 在响应内容前面添加文本
	    "prepend": "/User/xxx/top.txt", // 在响应内容前面添加的文件路径
	    "body": "request body", // 替换响应内容的文本
	    "replace": "/User/xxx/body.txt", // 替换响应内容的文件路径
	    "bottom": "append body", // 追加响应内容的文本
	    "append": "/User/xxx/bottom.txt", // 追加响应内容的文件路径
	    "delay": 6000, // 延迟响应的毫秒数
	    "speed": 20 // 设置响应速度(单位：kb/s，千比特 / 每秒)
	}

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

把 [www.ifeng.com](http://www.ifeng.com/) 后面添加文本及修改 `content-type` 为 `text/plain`

	www.ifeng.com req://{test-res}

Values 的 `test-res`:

	{
	    "bottom": "\ntest",
	    "headers": {
	        "Content-type": "text/plain"
	    }
    }


# resAppend {#rules_resAppend}

把指定的内容追加到响应内容后面(304 等响应没有内容无法追加)，配置模式：

	pattern resAppend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Append body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com resAppend://{test-resAppend.html}


test-resAppend.html:

	Append body


# resBody {#rules_resBody}

把指定的内容替换响应内容(304 等响应没有内容无法替换)，配置模式：

	pattern resBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Body body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com resBody://{test-resBody.html}


test-resBody.html:

	Body body


# resCharset {#rules_resCharset}

修改响应头 `content-type` 的 charset，配置模式：

	pattern resCharset://charset

charset 可以为 `utf8`、`gbk` 等等字符编码，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)

例子：

	www.ifeng.com resCharset://utf8


# resCookies {#rules_resCookies}

修改请求的 cookie，配置模式：

	pattern resCookies://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	{
		"key1": "value1",
		"key2": "value2",
		"keyN": {
            "value": "value1",
            "maxAge": 60,
            "httpOnly": true,
            "path": "/",
            "secure": true,
            "domain": ".example.com"
        }
	}

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com resCookies://{test-resCookies.json}


test-resCookies.json:

	{
		"key1": "value1",
		"key2": "value2",
		"keyN": {
            "value": "value1",
            "maxAge": 60,
            "httpOnly": true,
            "path": "/",
            "secure": true,
            "domain": ".example.com"
        }
	}


# resCors {#rules_resCors}

修改响应的[cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，配置模式：

	pattern resCors://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	origin: *
	methods: POST
	headers: x-test
	credentials: true
	maxAge: 300000

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

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


# resDelay {#rules_resDelay}

设置延迟响应的时间 (单位：毫秒)，配置模式：

	pattern resDelay://timeMS

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.ifeng.com resDelay://3000


# resHeaders {#rules_resHeaders}

修改请求头，配置模式：

	pattern resHeaders://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	x-test1: value1
	x-test2: value2
	x-testN: valueN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com resHeaders://{test-resHeaders.json}


test-resHeaders.json:

	x-test1: value1
	x-test2: value2
	x-testN: valueN


# responseFor {#rules_responseFor}

设置响应头的 `x-whistle-response-for` 字段(`whistle >= v1.7.1`)，主要方便自定义 whistle 的 Network SeverIP 显示真实的服务器环境或 IP，配置模式：

	pattern responseFor://env

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	# 修改 www.ifeng.com 请求头的 `x-whistle-response-for` 字段为 1.1.1.1
	www.ifeng.com responseFor://1.1.1.1


PS：某些情况下需要通过 nigix 转发，可以结合 [resScript](#rules_rules_resScript) 把响应头的 `x-upstream` 字段设置到 `x-whistle-response-for`，这样就可以在 whistle 的 Network 上看到真实的 IP


# resPrepend {#rules_resPrepend}

把指定的内容添加到响应内容前面(304 等响应没有内容无法添加)，配置模式：

	pattern resPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Prepend body

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	www.ifeng.com resPrepend://{test-resPrepend.html}


test-resPrepend.html:

	Prepend body


# resReplace {#rules_resReplace}

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换响应文本内容(响应的 content-type 必须文本类型：html、json、xml、text 等)，配置模式：

	pattern resReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com resReplace://{test-resReplace.json}


test-resReplace.json:

	/user=([^&])/ig: user=$1$1
	<script: <script crossorigin


# resScript {#rules_resScript}

给匹配的响应批量设置规则，或者通过脚本动态设置规则，配置模式：

	pattern resScript://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地 js 文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

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
3. `ip(clientIp)`: 客户端 ip
4. `headers`: 请求头部
5. `body`: 请求内容 (只有匹配了[reqScript](#rules_rules_reqScript) 才会有该字段)，如果没有请求内容为空字符串(`''`)，如果请求内容大于 16k，可能只能获取请求前面 16k 长度的内容(whistle >= v1.5.18)
6. `rules`: 存放新规则的数组
7. `values`: 存放临时 values 的对象(v1.7.1 开始支持)
8. `render(tplStr, data)`: 内置[microTemplate](https://johnresig.com/blog/javascript-micro-templating/)，方便通过模板渲染数据(v1.7.1 开始支持)
9. `getValue(key)`: 获取 Values 中对应 key 的值(v1.7.1 开始支持)
10. `parseUrl`: 同 `url.parse`(v1.7.1 开始支持)
11. `parseQuery`: 同 `querystring.parse`(v1.7.1 开始支持)
12. `statusCode`: 响应状态码(v1.7.1 开始支持)
13. `resHeaders`: 响应头(v1.7.1 开始支持)
14. `serverIp`: 服务器 ip(v1.7.1 开始支持)


用该方法可以解决此问题[#19](https://github.com/avwo/whistle/issues/19)，也可以用来做 ip_hash 等，具体用法看下面的例子


例子：

设置静态规则列表

	www.ifeng.com resScript://{resScript.txt}

resScript.txt:

	# 第一行没有这个注释符号，whistle 会认为是一个脚本
	http://www.ifeng.com/index.html redirect://http://www.ifeng.com/?test
	www.ifeng.com resType://text

通过脚本设置规则列表

	www.ifeng.com resScript://{resScript.js}

resScript.js:

	const options = parseUrl(url);
	rules.push(`${options.host} resCookies://{cookies.json}`);
	values['cookies.json'] = {
		serverIp,
		clientIp,
		from: 'resScript'
	};


# resSpeed {#rules_resSpeed}

设置响应速度 (单位：kb/s，千比特 / 每秒)，配置模式：

	pattern resSpeed://kbs

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

例子：

	www.ifeng.com resSpeed://3


# resType {#rules_resType}

修改请求头的 `content-type`，配置模式：

	pattern resType://mimeType

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)，mimeType 为新的 `content-type`，如：`text/plain`、`text/html`、`image/png` 等等，还有一些后缀关键字，whistle 会自动把它转成对应的 type：

	json: application/json
	xml: text/xml
	js: text/javascript
	txt: text/plain
	html: text/html
等等

例子：

	www.ifeng.com resType://text


# resWrite {#rules_resWrite}

将响应的内容 (如果有) 写入的指定的文件夹或文件；whistle 会根据请求的 url 和配置自动拼接成路径，且 whistle 不会覆盖已存在的文件，配置模式：

	pattern resWrite://filepath

filepath 为本地目录或文件，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	# 匹配 http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ resWrite:///User/test/index.html
	www.ifeng.com resWrite:///User/test


# resWriteRaw {#rules_resWriteRaw}

将响应的完整内容 (包括协议、状态码、状态信息、响应头、内容) 写入的指定的文件夹或文件；whistle 会根据请求的 url 和配置自动拼接成路径，且 whistle 不会覆盖已存在的文件，配置模式：

	pattern resWriteRaw://filepath

filepath 为本地目录或文件，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

例子：

	# 匹配 http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ resWriteRaw:///User/test/index.html
	www.ifeng.com resWriteRaw:///User/test


# rulesFile(ruleFile, rulesScript, ruleScript) {#rules_rulesFile}

> 该协议 `v1.7.0` 开始已经废弃，请使用 [reqScript](#rules_rules_reqScript) 代替

给匹配的请求批量设置规则，或者通过脚本动态设置规则，配置模式：

	pattern rulesFile://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地 js 文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。

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


# socks {#rules_socks}

设置 socks 代理，配置模式：

	pattern socks://ip:port

	# 加用户名密码
	pattern socks://username:password@ip:port

pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。


例子：

把所有请求代理到 `127.0.0.1:8888` 的代理服务器：

	/./ socks://127.0.0.1:1080
	www.facebook.com socks://test:123@127.0.0.1:1080


# statusCode {#rules_statusCode}

设置响应状态码 (状态码范围 `100~999`)，请求会直接根据设置的状态码返回，不会请求到线上，这个与[replaceStatus](#rules_rules_replaceStatus) 不同，后者是请求返回后再修改状态码，可以用于模拟各种状态码，配置模式：

	pattern statusCode://code

其中：code >= 100 && code <= 999，pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)。


例子：

	www.ifeng.com statusCode://500


# ua {#rules_ua}

修改请求头的 `user-agent` 字段，可用于模拟各种机器访问，配置模式：

	pattern ua://newUA

newUA 为新的 ua 字符串 (中间不能有空格) 或者 [Values](http://local.whistlejs.com/#values) 里面的{key}。

例子：

	www.ifeng.com ua://Mozilla/5.0

	# 把完整 UA 存在 Values 里面
	www.ifeng.com ua://{test-ua}

test-ua:

	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36


# urlParams {#rules_urlParams}

修改请求参数，配置模式：

	pattern urlParams://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	field1: value1
	field2: value2
	filedN: valueN

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[匹配模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com urlParams://(test=1)

括号的写法见：[Rules 的特殊操作符({}、()、<>)](#rules_webui_rules)


# urlReplace {#rules_urlReplace}

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换请求 url 的 path 部分(如 `http://www.test.com/xxx?xxx`，只能替换 url 中 `xxx?xxx` 这部分的内容)，配置模式：

	pattern urlReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](#rules_pattern)，更多模式请参考[配置模式](#rules_mode)，json 格式参考[数据格式](#rules_data)。

例子：

	www.ifeng.com urlReplace://{test-resReplace.json}


test-urlReplace.json:

	/user=([^&])/ig: user=$1$1
	index: news


# weinre {#rules_weinre}

weinre 可以用于调试远程页面特别是移动端的网页，配置模式：

	pattern weinre://key

key 为任意的字符串，主要用于区分页面，pattern 参见 [匹配方式](#rules_pattern)，更多模式请参考 [配置模式](#rules_mode)。

如何使用 weinre：

1. 配置手机代理：先把手机的请求代理到 whistle，ip 为 whistle 所在机器的 ip，端口号为 whistle 的监听的端口号 (默认为：8899)
配置要注入的请求 (系统会自动判断是否为 html，如果不是则不会自动注入)：

		# xxx 为对应的 weinre id，主要用于页面分类，默认为 anonymous
		www.example.com weinre://xxx
2. 手机打开配置的页面，然后点击 network 页面顶部操作栏的 Weinre 按钮，在下拉列表就可以找到设置的 weinre id 的，点击会新开一个 weinre 调试页面，可以开始使用 weinre

3. 手机调试或者远程访问时，可能会因为 whistle 所在机器的防火墙设置，导致无法远程访问，可以通过设置白名单，或者关闭防火墙：[http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html](http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)


