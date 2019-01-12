# 常见问题

> 有问题可以提[issue](https://github.com/avwo/whistle/issues/new)

1. 为什么[http://local.whistlejs.com](http://local.whistlejs.com/)无法访问？
 没有启动whistle或者配置代理，具体操作请参考[安装启动](install.html)

2. 为什么**Network**上看不到请求？
 没有用Chrome浏览器访问[http://local.whistlejs.com](http://local.whistlejs.com/)，或者是请求没有代理到指定的whistle，如何配置代理请参考[安装启动](install.html)
3. 手机或平板如何抓包请求？
  需要配置代理，且可能要关闭防火墙或者设置运行远程访问本地指定端口，具体参考[安装启动](install.html)
4. 为什么设置的规则对https请求不生效？
 需要安装根证书及开启https拦截，具体参考[https](webui/https.html)
 PS: Firefox自带根证书列表，系统根证书对Firefox不生效，需要对Firefox单独安装根证书。

5. 如何查看错误信息？
 如果是请求出错，可以在Network里面的Request或Response的Text里面看到，有些请求会把异常作为响应内容直接输出到界面；如果是内部运行出现的非致命性异常，可以在Network -> Log -> Server里面看到；如果是导致程序crash的异常，日志信息会写在命令行启动的目录的`whistle.log`文件。

6. 如何在一台机器同时启多个whistle？
 可以通过设置不同端口号及不同存储目录来启动不同whistle实例，具体参考[命令行操作](cli.html)。

7. 如何实现反向代理的功能？
  whistle作为反向代理只支持http访问，启动whistle时设置监听的端口为80:
  ```
  w2 start -p 80 
  ```
  > 如果提示whistle还在运行中，可以执行 `w2 restart -p 80`
  > 非root用户需要加`sudo w2 start -p 80`。

  这样就可以在whistle配置转发，如果没有配置whistle会自动重定向到抓包界面，如果想直接用机器的IP访问直接访问本机的服务，需要在路径里面加 `_` ，这样才能穿透whistle，如果 `http://10.1.1.1/_/xxx`，whistle会自动转成 `http://127.0.0.1/xxx`，并在whistle中配如下规则：
  ```
  http://10.1.1.1/xxx 10.1.1.1:5566
  ```

8. 如何让Rules支持多选？
 在[Rules](webui/rules.html)界面中打开Settings对话框，选中 `Use multiple rules` 即可。
9. 如何动态设置Rules？
  whistle支持以下两种方式动态设置：
  - 通过[dispatch](rules/dispatch.html)根据请求信息修改请求url的参数改变url，达到动态修改匹配规则的能力
  - 通过[插件方式](plugins/plugins.html)的方式动态设置规则，这种方式更加直接，且功能更强大，基本上可以操作whistle的任何功能，且可以自定义协议功能

10. 如何过滤调部分规则？
  whistle支持过滤指定协议的规则，也支持过滤 `pattern`，具体参见：[ignore](rules/ignore.html)、[filter](rules/filter.html)
11. 安装根证书时无法下载，检查下是否设置好代理。
12. iOS安装根证书时提示无法连接后台服务器，检查下是否开启了**Https拦截功能**，如果已开启，请暂时关闭，根证书安装成功再开启。
13. 如何过滤Network上的请求？
  有三种方式：
  - 界面过滤：[Networ > Settings](webui/settings.html)
  - 搜索过滤：[Networ > 下方搜索过滤框](webui/network.html)
  - 后台过滤，参见：[enable](enable.html)
14. 安装iOS根证书后，还是提示证书错误？
  `iOS SSLHandshake: Received fatal alert: unknown_ca`，出现这个错误是因为 iOS 10.3 之后需要手动信任自定义根证书，设置路径：`Settings > General > About > Certificate Trust Testings`

  [具体可以看这里](http://www.neglectedpotential.com/2017/04/trusting-custom-root-certificates-on-ios-10-3/)

  <img src="img/ios10.3_ca.PNG" width="320">

15. [更新whistle](./update.html)时出现失败或更新后 `w2 -V` 指向老的版本，可以参考：[更新文档](./update.html)
16. android 6.0 之后的一些app在成功安装证书后仍然无法对https连接进行手抓包，有可能是该app没有添加信任用户自定义证书的权限。请确认该app是否有如下配置：
```
<base-config cleartextTrafficPermitted="true">
    <trust-anchors>
        <certificates src="system" />
        <certificates src="user" />
    </trust-anchors>
</base-config>
```
  这主要是因为android 6.0之后的版本默认配置发生了变化，[更多请看Android开发文档](https://developer.android.com/training/articles/security-config#base-config)。
17. 如何修改whistle本地存储目录
  - 启动命令行指定 `-D baseDir`
  - 配置环境变量 `WHISTLE_PATH=baseDir`
18. 如何加载自定义证书

新建一个目录(`/xxx/ssl`)，把自定义证书放到此目录，证书必须后缀为`.crt`格式，每个证书的key和crt文件名称必须一致(如：`test.key`、`test.crt`，支持多域名证书，如果是根证书名字必须为 `root.key`、`root.crt`)，启动是时加启动参数 `w2 start -z /xxx/ssl` 即可
