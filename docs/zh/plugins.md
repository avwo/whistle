# 插件开发
为了满足一些特定业务场景自定义规则的需求，whistle提供了插件扩展能力，通过插件可以扩展whistle的协议实现更复杂的操作、保存或监控指定请求、集成业务本地开发调试环境等等，基本上可以做任何你想做的事情，且开发、发布及安装whistle插件也都很简单。


先了解下如何安装使用插件：

#### 安装插件
whistle的插件就是一个Node模块，名字必须为 `whistle.your-plugin-name` 或 `@org/whistle.your-plugin-name`，其中 `your-plugin-name` 为插件名称，只能包含小写字母、数字、_、-四种字符，安装插件直接全局npm安装即可：

```
npm i -g whistle.your-plugin-name
# 或
npm i -g @org/whistle.your-plugin-name
```
> Mac或Linux安装时如果报权限错误，则需要加上sudo，如：sudo npm i -g whistle.your-plugin-name
> 国内可以用[cnpm](https://github.com/cnpm/cnpm)或公司内部自己的镜像安装

全局安装后，可以在whistle的界面上看到所有已安装的插件列表(whistle定时搜索npm的全局目录，并自动加载或卸载插件，无需重启whistle)。

> 要更新插件的时候，重新install即可

![插件列表](img/plugin-list.png)

#### 使用插件
插件安装后，whistle会新增两个协议，分别为 `whistle.your-plugin-name` 和 `your-pluign-name`，用户通过配置：
```
pattern whistle.your-plugin-name://xxx
# 或
pattern your-plugin-name://xxx
```
匹配到上述规则的请求会自动请求插件相应的server，上述两种配置有些差异，后面再详细说下，下面我们先了解下插件基本原理，再快速开发一个whistle插件的项目。

# 实现原理
whistle的插件是一个独立运行的进程，这样是为了确保插件不会影响到whistle主进程的稳定性，并通过暴露一些http server的方式实现与whistle的交互，whistle会在特定阶段请求特定的server，具体看下面的原理图：

![http请求](img/http-request.png)
![http请求插件过程](img/plugin1.png)
> 图一：表示http(s)、WebSocket请求涉及到的插件内置server

![tunnel请求](img/tunnel-request.png)
![tunnel请求插件过程](img/plugin2.png)

> 图二：表示tunnel请求涉及到的插件内置server，tunnel请求如上图指没有开启https捕获，或一般的TCP请求

从上面几个图可以知，whistle插件会设计以下几种server：

1. statsServer：统计请求信息的服务
2. resStatsServer：统计响应信息的服务
3. rulesServer：设置请求规则的服务(支持http/https/websocket请求)
4. resRulesServer：设置响应规则的服务(支持http/https/websocket请求)
5. tunnelRulesServer：设置tunnel请求规则的服务
6. server：whistle会把指定请求转发到该server

以上这些server都是可选的，根据需要实现对应的server即可，比如：

1. 统计请求信息，可以用 `statsServer` (统计响应信息可以用 `resStatsServer`)；
2. 设置请求规则可以用 `rulesServer` (如果是tunnel请求用 `tunnelRulesServer`，如果这两种请求的规则都一样，可以用 `pluginRulesServer`)；
3. 设置响应规则可以用 `resRulesServer`；
4. 如果想独占操作请求，可以用 `server`，whistle会把指定请求转发到该server

除了上面几种功能性server外，whistle插件提供了 `uiServer` 用于显示插件的配置管理界面，用户可以在whitle界面的 `Plugins` 列表里点击Option或右键新窗口打开对应插件的界面，或直接访问 `http://local.whistlejs.com/whistle.helloworld/`，如果没有实现`uiServer`，whistle会自动返回404，也可以给插件自定义域名，这样就可以通过独立域名访问插件的管理界面，只需在启动参数里面加 `-L "helloworld=hello.oa.com"` (`helloworld` 为插件名称)，然后把 `hello.oa.com` 的dns指向whistle所在机器的IP即可，这样可以通过 `http://hello.oa.com:8899/` (`8899`表示whistle监听的端口)访问 `whistle.helloworld` 的界面。

# 快速上手
> whistle的规则和API都会兼容老版本，但建议大家及时更新whistle到最新版本，以便体验更多的功能，下面的例子要求whistle的版本号`>=v1.11.4`，更新whistle请参考[帮助文档](update.html)

下面我们来实现如下功能的插件：

1. 根据请求url里面的形如 `req.headers.x-key1-name=value1&res.headrs.x-key2-name=value2&host=127.0.0.1` 参数设置请求及响应头、服务器IP
2. 把服务器IP设置到响应头字段 `x-server-ip`
3. 把抓包数据保存到通过UI配置的文件路径
4. 支持mock数据

#### 创建项目
创建一个名为[whistle.hellworld](https://github.com/whistle-plugins/whistle.helloworld)的项目:

```txt
whistle.helloworld
  |__ package.json
  |__ index.js
  |__ lib
      |__ uiServer.js
      |__ rulesServer.js
      |__ server.js
      |__ resRulesServer.js
```
具体项目代码请访问Github：[https://github.com/whistle-plugins/whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)。


#### 调试项目
在项目根目录执行下面命令把本地模块link到全局目录：

```sh
npm link
# 或
sudo npm link

# 开启whistle的调试模式
w2 stop
w2 run
```

> 如果代码修改后想重新加载插件，可以修改下 `package.json` 这个文件，比较添加或删除一个空格等，whistle检查到项目的 `package.json` 的修改时间有变更会重新加载插件 

这样whistle会自动加载改插件，如果插件有代码更新，需要触发修改package.json这个文件，比如加个空格，或者直接加个字段，每次修改下这个字段，whistle会检查package.json是否有更改，如果更改的话会自动重启。

卸载本地插件：

```sh
npm unlink
# 或
sudo npm unlink

# 如果npm link不是在模块所在根目录执行，可以采用下面这种方式卸载本地开发的全局模块
npm unlink whistle.xxx -g
# 或
sudo npm unlink whistle.xxx -g
```

#### 测试效果
配置如下规则：
```
ke.qq.com/test whistle.helloworld://
ke.qq.com/mock helloworld://test
```
  

#### 发布项目
同发布正常的node模块，可以通过以下几种方式发布：

1. 公共的node模块，直接上传到npm仓库：
  ```sh
  # 登陆npm login后，在模块的根目录(package.json所在目录)执行
  npm publish
  ```
2. 自建的npm仓库，有些公司会自建自己的仓库
  ```sh
  xnpm publish
  ```
到此完成一个插件的开发，完整API如下：
#### API文档
1. `initial.js`：
2. `rules.txt`:
3. `_rules.txt`:
4. `_values.txt`:
5. `rulesServer`:
6. `tunnelRulesServer`:
7. `statsServer`:
8. `server`:
9. `resRulesServer`:
10. `resStatsServer`:


更多例子参考：

1. [https://github.com/whistle-plugins/whistle.script](https://github.com/whistle-plugins/whistle.script)
2. [https://github.com/whistle-plugins](https://github.com/whistle-plugins)
