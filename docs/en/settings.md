# 设置代理

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
