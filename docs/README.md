## 安装启动 {#install}

安装启动 whistle，需要以下几个步骤：

1. 安装 Node
2. 安装 whistle
3. 启动 whistle

#### 1. 安装 Node

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


#### 2. 安装 whistle

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


#### 3. 启动 whistle

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

#### 启动多个 whistle
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


## 设置代理 {#setting}

#### 配置信息

1. 代理服务器：127.0.0.1(如果部署在远程服务器或虚拟机上，改成对应服务器或虚拟机的 ip 即可)
2. 默认端口：8899(如果端口被占用，可以在启动是通过 `-p` 来指定新的端口，更多信息可以通过执行命令行 `w2 help` (`v0.7.0` 及以上版本也可以使用 `w2 help`) 查看)

> 勾选上 ** 对所有协议均使用相同的代理服务器 **


#### 代理配置方式 (把上面配置信息配置上即可)

1. 直接配置系统代理：　
  * [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html)
  * [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. 安装浏览器代理插件 (** 推荐 **)

	* 安装 Chrome 代理插件： [whistle-for-chrome 插件](https://github.com/avwo/whistle-for-chrome) 或者 [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	* 安装 Firefox 代理插件： [Proxy Selector](https://addons.mozilla.org/zh-cn/firefox/addon/proxy-selector/)

3. 移动端需要在 ` 设置 ` 中配置当前 Wi-Fi 的代理

PS: 如果配置完代理，手机无法访问，可能是 whistle 所在的电脑防火墙限制了远程访问 whistle 的端口，关闭防火墙或者设置白名单：[ http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html]( http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)


#### 访问配置页面

启动 whistle 及配置完代理后，用 **Chrome 浏览器 (由于 css 兼容性问题界面只支持 Chrome 浏览器)** 访问配置页面，如果能正常打开页面，whistle 安装启动完毕，可以开始使用。

可以通过以下两种方式来访问配置页面：

* 方式 1：域名访问 [http://local.whistlejs.com/](http://local.whistlejs.com/)
* 方式 2：通过 ip + 端口来访问，形式如 `http://whistleServerIP:whistlePort+1/` e.g. [http://127.0.0.1:8900](http://127.0.0.1:8900)



## 安装证书 {#https}

> 建议使用 `Node v6` 或以上版本，否则性能及在 Chrome 或 APP 上 [抓包 HTTPS 请求](https://avwo.github.io/whistle/webui/https.html) 会有问题。

> 如果出现 HTTPS 的问题 ([#44](https://github.com/avwo/whistle/issues/44))，升级 Node 到 `v6` 及以上版本，[更新 whistle](https://avwo.github.io/whistle/update.html) 到最新版本，通过 `w2 restart -A` (注意后面加 `-A`)启动生成新的更证书，再 [安装下根证书](https://avwo.github.io/whistle/webui/https.html) 即可。

> ** 在 iOS 上安装根证书时，需要先关闭[https 拦截](https://avwo.github.io/whistle/webui/https.html)，否则将显示安装失败。**

用来下载根证书、隐藏 `connect` 类型的请求、开启 Https 拦截功能。

![Https](https://avwo.github.io/whistle/img/https.gif)


##### 安装根证书

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

##### 开启拦截 Https

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


## 快速入门 {#quickstart}

> 推荐看这篇文章：[whistle 工具全程入门](http://imweb.io/topic/596480af33d7f9a94951744c)

按 [上述方法](install.html) 安装好 whistle 后，用 Chrome 浏览器打开配置页面: [http://local.whistlejs.com](http://local.whistlejs.com/)

如图[Rules](webui/rules.html)，whistle 的 Rules 配置页面有一个默认分组 `Default`，用户也可以通过上面的菜单栏按钮 `Create`、`Edit`、`Delete` 分别创建、重命名、删除自定义分组，whistle 先在选中的用户自定义分组中从上到下依次匹配，然后再到 `Default` 中匹配(如果 `Default` 分组被启用的情况下)。

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
 更多匹配方式参考：[匹配方式](pattern.html)

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
	
	[http://www.ifeng.com/xxx](#)会先尝试加载 `/User/username/test/xxx` 这个文件，如果不存在，则会加载 `/User/username/test/xxx/index.html`，如果没有对应的文件则返回 404。
	
	也可以替换 jsonp 请求，具体参见[tpl](rules/rule/tpl.html)

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

	利用 whistle 提供的 [weinre](rules/weinre.html) 和 [log](rules/log.html) 两个协议，可以实现修改远程页面 DOM 结构及自动捕获页面 js 错误及 console 打印的信息，还可以在页面顶部或 js 文件底部注入指定的脚步调试页面信息。
	
	使用 whistle 的功能前，先把要相应的系统代理或浏览器代理指向 whistle，如何设置可以参考：[安装启动](install.html)
	
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


更多功能请参考：[协议列表](rules/index.html)


## 常见问题 {#questions}

> 有问题可以提 issue： [New issue](https://github.com/avwo/whistle/issues/new)

1. 为什么 [http://local.whistlejs.com](http://local.whistlejs.com/) 无法访问？

 没有启动 whistle 或者配置代理，具体操作请参考 [安装启动](install.html)

2. 为什么 **Network** 上看不到请求？

 没有用 Chrome 浏览器访问 [http://local.whistlejs.com](http://local.whistlejs.com/)，或者是请求没有代理到指定的 whistle，如何配置代理请参考 [安装启动](install.html)

3. 手机或平板如何抓包请求？

 需要配置代理，且可能要关闭防火墙或者设置运行远程访问本地指定端口，具体参考 [安装启动](install.html)

4. 为什么设置的规则对 https 请求不生效？

 需要安装根证书及开启 https 拦截，具体参考 [https](webui/https.html)

 PS: Firefox 自带根证书列表，系统根证书对 Firefox 不生效，需要对 Firefox 单独安装根证书。

5. 如何查看错误信息？

 如果是请求出错，可以在 Network 里面的 Request 或 Response 的 Text 里面看到，有些请求会把异常作为响应内容直接输出到界面；如果是内部运行出现的非致命性异常，可以在 Network -> Log -> Server 里面看到；如果是导致程序 crash 的异常，日志信息会写在命令行启动的目录的 `whistle.log` 文件。

6. 如何在一台机器同时启多个 whistle？

 可以通过设置不同端口号及不同存储目录来启动不同 whistle 实例，具体参考 [安装启动](install.html)。

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

 在 [Rules](webui/rules.html) 界面中打开 Settings 对话框，选中 `Allow multiple choice` 即可。

9. 如何动态设置 Rules？

  whistle 支持以下两种方式动态设置：

  - 通过 [dispatch](rules/dispatch.html) 根据请求信息修改请求 url 的参数改变 url，达到动态修改匹配规则的能力
  - 通过 [插件方式](plugins/plugins.html) 的方式动态设置规则，这种方式更加直接，且功能更强大，基本上可以操作 whistle 的任何功能，且可以自定义协议功能

10. 如何过滤调部分规则？

 某些情况下，需要把匹配到的某部分请求过滤掉，这个时候可以用 [filter](rules/filter.html) 来设置过滤 `pattern filter://xxx|yyy|zzz|...`，如果想过滤做本地替换时本地没有对应文件的请求可以用 [xfile](rules/rule/xfile.html)。

11. 安装根证书时无法下载，检查下是否设置好代理。

12. iOS 安装根证书时提示无法连接后台服务器，检查下是否开启了 **Https 拦截功能 **，如果已开启，请暂时关闭，根证书安装成功再开启。

13. iOS 10.3 证书问题
  `iOS SSLHandshake: Received fatal alert: unknown_ca`，出现这个错误是因为 iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="https://avwo.github.io/whistle/img/ios10.3_ca.PNG" width="320">


## 匹配方式 {#pattern}

> HTTPS、Websocket 需要 [开启 HTTPS 拦截](webui/https.html)，whistle 才能获取完整的请求 url，对这部分请求只有域名匹配能完整支持 (路径匹配只支持 `tunnel://host 或 tunnel://host:port`)，为了让匹配方式对所有请求都生效请先 [开启 HTTPS 拦截](webui/https.html)

whistle 对所有操作支持 ** 域名、路径、正则、精确匹配、通配符匹配、通配路径匹配 ** 六种种匹配方式 ([安装最新版本](update.html) 才能确保这些匹配方式都支持才支持)。

#### 域名匹配
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

#### 路径匹配

路径匹配可以通过设置父路径来匹配请求 url，父路径也可以去掉请求协议，这样所有请求只要是该路径或该路径下的子路径都可以匹配，如果 operator-uri 不为请求路径，pattern 和 operator-uri 位置可以调换。

	# 限定请求协议，只能匹配 http 请求
	http://www.test.com/xxx operator-uri
	http://www.test.com:8080/xxx operator-uri
	
	# 匹配指定路径下的所有请求
	www.test.com/xxx operator-uri
	www.test.com:8080/xxx operator-uri
	
*Note: 协议包含 http、https、ws、wss，tunnel 共 5 种，tunnel 协议的 url 只有根路径不支持子路径匹配 *

#### 正则匹配
正则的语法及写法跟 js 的正则表达式一致，支持两种模式：/reg/、/reg/i 忽略大小写，支持子匹配，<del > 但不支持 / reg/g</del>，且可以通过正则的子匹配把请求 url 里面的部分字符串传给 operator-uri，pattern 和 operator-uri 位置可以调换。
	
	# 匹配所有请求
	/./ operator-uri

	# 匹配 url 里面包含摸个关键字的请求，且忽略大小写
	/keyword/i operator-uri

	# 利用子匹配把 url 里面的参数带到匹配的操作 uri
	# 下面正则将把请求里面的文件名称，带到匹配的操作 uri
	/[^?#]\/([^\/]+)\.html/ protocol://...$1... #最多支持 9 个子匹配 $1...9

*Note: 协议包含 http、https、ws、wss，tunnel 共 5 种，tunnel 协议的 url 只有根路径不支持子路径匹配 *

#### 精确匹配

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

#### 通配符匹配 (whistle 版本必须为 v1.4.10 及以上)
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

#### 通配路径匹配 (whistle 版本必须为 v1.4.18 及以上)

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


## 操作值 {#mode}

whistle 的所有操作都可以通过配置实现，配置模式扩展于系统 hosts 配置模式 (`ip domain` 或组合模式 `ip domain1 domain2 domainN`)，具有更丰富的[匹配方式](pattern.html) 及更灵活的配置模式。whistle 的匹配顺序是从左到右，这与传统 hosts 从右到左的配置模式不同，但为了兼容传统 hosts 配置模式，除了 pattern 和 operator-uri 都可以为请求 url 外(这种情况 whistle 无法自动区分 pattern 和 operator-uri，只能按约定的顺序匹配)，其它情况 whistle 都支持配置两边的位置对调，即：`pattern operator-uri` 和 `operator-uri pattern` 等价。

> whistle 跟传统 hosts 配置一样也采用 `#` 为注释符号


#### whistle 有以下三种匹配模式：

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
其中，pattern 请参考：[匹配方式](pattern.html)


## 插件开发 {#plugins}

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

#### 编写插件

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

#### 调试插件

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

#### 发布插件
同发布正常的 node 模块，模块编写完毕，可以通过以下几种方式发布：

1. 公共的 node 模块，直接上传到 npm 仓库：

		# 登陆 npm login 后，在模块的根目录 (package.json 所在目录) 执行
		npm publish

2. 自建的 npm 仓库，有些公司会自建自己的仓库
		
		xnpm publish
		
#### 安装插件
同安装全局的 node 模块，只需直接通过 npm 安装，需要安装到全局

	npm install -g whistle.protocol
	# 或
	xnpm install -g whistle.protocol
	# 或
	xnpm install -g @org/whistle.protocol

		
#### 更新插件
可以通过直接重复上述安装插件的方式强制更新，直接通过 npm 更新:

	npm update -g whistle.protocol
	# 或
	xnpm update -g whistle.protocol
	# 或
	xnpm update -g @org/whistle.protocol
		
	
#### 卸载插件


	npm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g @org/whistle.protocol



#### 使用插件
安装完插件，直接可以在 whistle 中配置
	
	pattern   protocol://ruleValue
                    
	配置完以后 whistle 会自动把匹配到的请求转发到对应 protocol 的插件 whistle.protocol 上，并把 ruleValue 传给插件服务器   



更多内容可以参考：

1. [https://github.com/whistle-plugins/whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)
2. [https://github.com/whistle-plugins](https://github.com/whistle-plugins)


## 用户反馈 {#feedback}

1. 有问题请直接提 issue: [New issue](https://github.com/avwo/whistle/issues/new)
2. 欢迎提 PR: [Pull requests](https://github.com/avwo/whistle/compare)
3. 有什么问题也可以通过 QQ 群反馈: 462558941


