<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://user-images.githubusercontent.com/11450939/168828068-99e38862-d5fc-42bc-b5ab-6262b2ca27d6.png">
  </a>
</p>

# whistle

[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js->=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/aur/license/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

中文 · [English](./README-en_US.md)

Whistle 是一款基于 Node.js 实现的跨平台网络抓包调试工具，具有：
1. **功能强大**
   - 支持 HTTP 代理、HTTPS 代理、Socks 代理、反向代理多种代理模式
   - 支持查看和修改 HTTP、HTTPS、HTTP/2、WebSocket、TCP 请求/响应
   - 内置多种常用调试工具：
     - Weinre：查看远程页面的 DOM 结构、
     - Log：查看远程页面的 console 日志、
     - Composer：重放及编辑请求
2. **操作简单**
   - 支持通过配置简单的文本规则修改请求/响应
   - 提供一站式 GUI 界面查看抓包、配置规则、管理插件、操作 Weinre/Log/Composer 等
3. **可扩展**
   - 支持通过插件扩展规则及界面的功能
   - 支持作为 NPM 包被项目引用
4. **跨平台**
   - 支持 macOS、Windows、Linux（Ubuntu/Fedora）等桌面系统
   - 支持无界面 Linux 服务器

# 安装

**macOS、Windows、Linux（Ubuntu/Fedora）等桌面系统推荐使用 Whistle 客户端：[https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client)**

>  使用 Whistle 客户端可以跳过该安装步骤

无界面 Linux 服务器等环境，请按以下 4 个步骤操作：

1. **安装 Whistle**，推荐用 NPM 安装：`npm i -g whistle`（需要先安装 Node.js：https://nodejs.org/ ）

   > 也支持通过 brew 安装：`brew install whistle`（需要先安装 brew：https://brew.sh/ ）

2. **启动 Whistle**，命令行执行：`w2 start`

3. **安装根证书**，命令行执行：`w2 ca`

   > 根证书安装过程可能需要手动确认：
   >
   > <details>
   >   <summary>Windows 需要最后点击 “是(Y)” 确认</summary>
   >   <img alt="点击 是(Y)" width="420" src="https://user-images.githubusercontent.com/11450939/168846905-384e0540-e02f-46de-81d7-e395a496f032.jpeg">
   > </details>
   >
   > <details>
   >   <summary>macOS 需要输入开机密码或指纹验证</summary>
   >   <img alt="输入开机密码" width="330" src="https://user-images.githubusercontent.com/11450939/176977027-4a7b06a0-64f6-4580-b983-312515e9cd4e.png">
   >   <img alt="输入指纹" width="330" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">
   > </details>
   >

4. **设置代理**，命令行执行：`w2 proxy`

   > macOS 首次设置代理可能需要输入锁屏密码
   >
   > 设置指定 IP 或端口：`w2 proxy "10.x.x.x:8888"`
   >
   > 关闭系统代理：`w2 proxy 0`
   >
   > 其它设置代理的方式：
   >
   > 1. **【推荐】** 通过安装 Chrome 插件 SwitchyOmega 设置代理：https://chromewebstore.google.com/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif （无法访问可手动安装：https://proxy-switchyomega.com/download/）
   >
   > 2. 直接在客户端上设置代理，如 FireFox、微信开发者工具等内置了设置代理功能
   >
   >    <details>
   >      <summary>FireFox 设置代理示例图</summary>
   >        <img width="1100" alt="image" src="https://github.com/user-attachments/assets/98c1ec5d-4955-4e23-a49a-c1015b128d9d" /> 
   >    </details>
   >
   > 3. 通过 Proxifier 设置代理（针对无法设置代理且不使用系统代理的客户端）：https://www.proxifier.com/docs/win-v4/http-proxy.html
   >


# 使用

安装完成后，打开[客户端](https://github.com/avwo/whistle-client)或通过浏览器上打开链接 http://local.whistlejs.com ，即可看到 Whistle 的操作界面：

<img width="1200" alt="network" src="https://github.com/user-attachments/assets/3186e76a-486a-4e61-98a1-2d4b4f91fad0" />

其中：

1. Network：查看抓包、编辑重放界面
2. Rules：规则配置界面
3. Values：数据配置界面（配合 Rules 使用）
4. Plugins ：插件管理界面

## 界面功能

<details>
  <summary>重放请求</summary>
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/9f8276ac-e089-427b-97f4-becac250ae5e" />
</details>

<details>
  <summary>编辑或构造请求</summary>
  <img width="1200" alt="image" src="https://github.com/user-attachments/assets/f2a5b088-72b6-4098-8ba6-3e42f15f3ad8" />
</details>

其它界面功能参见完整文档：https://wproxy.org/whistle/webui/

## 配置规则

规则结构：

``` txt
pattern operation [includeFilter://pattern1 excludeFilter://pattern2 ...]
```

1. pattern：URL匹配模式（支持域名、路径、正则、通配符多种格式）
2. operation：执行的操作，如修改请求头
3. includeFilter/excludeFilter：可选过滤条件，可设置多个，支持匹配请求 URL、请求方法、请求内容、响应状态吗、响应头

#### 示例1：修改 DNS（设置 Hosts）

1. 域名匹配

   ``` txt
   www.test.com 127.0.0.1
   # 支持带端口
   www.test.com 127.0.0.1:8080
   # CNAME 功能（端口可选）
   www.test.com host://www.example.com:8181
   ```
   > 与系统 hosts 规则不同的是 Whistle 规则默认采用**从左到右的映射方式**，**从上到下的优先级**

2. 路径匹配

   ``` txt
   www.test.com/path/to 127.0.0.1:8080
   # 支持带协议
   https://www.test.com/path/to 127.0.0.1:8080
   ```

3. 通配符匹配

   ``` txt
   # 域名通配符，匹配 test.com 的所有子代域名
   **.test.com 127.0.0.1:8080
   # 支持带协议域名通配符
   https://**.test.com 127.0.0.1:8080
   # 路径通配符（* 是路径的合法字符，所以前面要加 ^ 告诉 Whistle 是通配符）
   ^**.test.com/*/path/to 127.0.0.1:8080
   # 支持带协议路径通配符
   ^https://**.test.com/*/path/to 127.0.0.1:8080
   ```

   >  `*`、`**`、`***` 匹配的范围不同，详情参见完整文档：https://wproxy.org/whistle/pattern.html

4. 正则匹配

   ``` txt
   # 内部的 `/` 可以不转义，等价于 `new RegExp('^https?://\w+\.test\.com')`
   /^https?://\w+\.test\.com/ 127.0.0.1:8080
   ```

5. 过滤匹配

   ``` txt
   # `pattern` 同上面的域名、路径、正则，表示除了匹配 `pattern` 还要满足请求头 `cookie` 包含 `env=test`
   pattern 127.0.0.1:8080 includeFilter://reqH.cookie=/env=test/

   # 只对 iPhone 请求生效
   https://www.test.com/path/to 127.0.0.1:8080 includeFilter://reqH.user-agent=/iPhone/i
   ```

##### 示例2：修改表单数据

``` txt
# 修改表单里面的 `test` 字段的值
pattern reqMerge://test=123

# 删除表单里面的 `abc` 字段
pattern delete://reqBody.abc
```

##### 示例3：设置跨域响应头

``` txt
# 以路径匹配为例，设置跨域响应头 Access-Control-Allow-Origin: *，且排除 OPTION 请求
pattern resCors://* excludeFilter://m:option

# 需要带上 cookie 的跨越请求
pattern resCors://enable
```

所有规则参见完整文档：https://wproxy.org/whistle/rules/

### 安装插件

1. 点击左侧导航栏的 Plugins 标签页
2. 点击顶部的 Install 按钮
3. 在弹出窗口中输入插件名称（支持同时安装多个插件）：
   - 多个插件用空格或换行符分隔
   - 可指定自定义 npm 镜像源：
     - 直接在插件名后添加 --registry=镜像地址
     - 或从下拉列表选择历史使用过的镜像源

<img width="1000" alt="install plugins" src="https://github.com/user-attachments/assets/53bfc7b1-81a8-4cdb-b874-c0f9ab58b65a" />

**示例**（安装两个插件并使用国内镜像源）：

``` txt
w2 install --registry=https://registry.npmmirror.com whistle.script whistle.inspect
```

> 也可以通过命令行安装：`w2 i whistle.script whistle.inspect`
> 
> 上述插件 GitHub 仓库：
> 
> whistle.script：https://github.com/whistle-plugins/whistle.script
> 
> whistle.inspect：https://github.com/whistle-plugins/whistle.inspect
> 

安装后即可在管理界面的 Plugins 看到这两个插件：

<details>
  <summary>插件列表示例图</summary>
  <img width="1000" alt="image" src="https://github.com/user-attachments/assets/ec018691-c7a9-415e-9809-bf079694c024" />
</details>

除了扩展规则，插件还可以扩展界面功能，详见：https://wproxy.org/whistle/plugins.html

# 移动设备抓包配置

# License

[MIT](./LICENSE)

