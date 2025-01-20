<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://user-images.githubusercontent.com/11450939/168828068-99e38862-d5fc-42bc-b5ab-6262b2ca27d6.png">
  </a>
</p>

# Whistle

[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js->=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/aur/license/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

中文 · [English](./README-en_US.md)

Whistle 是基于 Node.JS 实现的操作简单、功能强大的跨平台抓包调试工具，可作为 **HTTP 代理（默认）**、**HTTPS 代理**、**Socks 代理**、**反向代理**等，用于**抓包分析**或**通过配置规则修改** HTTP、HTTPS、HTTP/2、WebSocket、TCP 请求，且内置 **Weinre**、**Log** 、**Composer** 等工具可查看远程页面的 DOM 结构、查看 console 输出内容、重放编辑构造请求等，并支持 **插件扩展功能** 或 **作为 NPM 包被项目引用**。

# 安装

**Windows PC 或 Mac PC 推荐使用客户端：[https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client)。**

>  如果采用 Whistle 客户端可以跳过该安装步骤

Linux PC、服务器等其它系统可以用命令行版本，需严格按如下 4 个步骤安装：

1. 安装 Whistle
2. 启动 Whistle
3. 安装根证书
4. 设置代理

### 安装 Whistle

根据实际情况选择以下一种安装方式即可：

1. 通过 npm 安装（需要先安装 Node.JS：https://nodejs.org/ ）：

   ``` sh
   npm i -g whistle
   ```

2. 通过 brew 安装（需要先安装 brew：https://brew.sh/ ）：

   ``` sh
   brew install whistle
   ```

### 启动 Whistle

``` sh
w2 start
```

> Whistle 默认启动 HTTP 代理（IP：`127.0.0.1`，端口： `8899`），可以通过 `w2 start -p 8888` 修改端口，如果已启动需要通过 `w2 restart -p 8888` 重启修改端口

完整命令行功能参见完整文档：https://wproxy.org/whistle/options.html

### 安装根证书

启动 Whistle 后可以通过下面的命令安装根证书：

``` sh
w2 ca --enable-https
```

<details>
  <summary>Windows 需要最后点击 “是(Y)” 确认</summary>
  <img alt="点击 是(Y)" width="420" src="https://user-images.githubusercontent.com/11450939/168846905-384e0540-e02f-46de-81d7-e395a496f032.jpeg">
</details>

<details>
  <summary>Mac 需要输入开机密码或指纹验证</summary>
  <img alt="输入开机密码" width="330" src="https://user-images.githubusercontent.com/11450939/176977027-4a7b06a0-64f6-4580-b983-312515e9cd4e.png">
  <img alt="输入指纹" width="330" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">
</details>

手机等其它端如何安装根证书参见完整文档：https://wproxy.org/whistle/webui/https.html

### 设置代理

**Windows PC 或 Mac PC 有以下四种方式，根据实际情况选择其中一种即可：**

1. **【推荐】** 通过安装 Chrome 插件 SwitchyOmega 设置代理：https://chromewebstore.google.com/detail/proxy-switchyomega/padekgcemlokbadohgkifijomclgjgif

   > Chrome 应用商店需要翻墙，如果无法访问请手动安装：https://proxy-switchyomega.com/download/

   <details>
     <summary>SwitchyOmega 设置方法示例图</summary>
   	<img width="620" alt="image" src="https://github.com/user-attachments/assets/24016b7c-8f2a-45a3-9dc8-5ef3ddf46233" /><img width="180" alt="image" src="https://github.com/user-attachments/assets/43afd3cd-5c17-4d6a-82d0-20a7ef2e0d99" />
   </details>

2. 通过命令行设置系统代理：

   ```. sh
   w2 proxy
   ```

   > 也可以指定IP（默认`127.0.0.1`）和端口： `w2 proxy "10.x.x.x:8888"` ，关闭系统设置代理用 `w2 proxy 0`

3. 直接在客户端上设置代理，如 FireFox、微信开发者工具等内置了设置代理功能
    <details>
      <summary>FireFox 设置代理示例图</summary>
        <img width="1100" alt="image" src="https://github.com/user-attachments/assets/98c1ec5d-4955-4e23-a49a-c1015b128d9d" /> 
    </details>
4. 通过 Proxifier 设置代理（针对无法设置代理且不使用系统代理的客户端）：https://www.proxifier.com/docs/win-v4/http-proxy.html

**Linux 设置路径: Settings > Network > VPN > Network Proxy > Manual**
  <details>
    <summary>Linux 设置代理示例图</summary>
      <img width="1000" alt="image" src="https://github.com/user-attachments/assets/e9441d32-c818-4446-8be6-0fa3df3aed86" />
  </details>

**手机等移动端设备需要在 `设置` 中配置当前 `Wi-Fi` 的代理，以 iOS 为例：**
  <details>
    <summary>iOS 设置代理示例图</summary>
      <img width="1000" alt="image" src="https://github.com/user-attachments/assets/e97dc311-2ace-4287-b6b0-0247b13974a9" />
  </details>

# 使用

按上面步骤安装好 Whistle，在 Chrome 浏览器上打开链接 http://local.whistlejs.com ，即可看到如下操作界面：

<img width="1200" alt="network" src="https://github.com/user-attachments/assets/3186e76a-486a-4e61-98a1-2d4b4f91fad0" />

<img width="1200" alt="rules" src="https://github.com/user-attachments/assets/2e336403-4810-48e5-91c1-6f22dcda7388" />

其中，Network 为查看抓包界面，Rules 为配置规则，Values 为配置数据界面（配合 Rules 使用），Plugins 为已安装的插件列表。

### 界面功能

<details>
  <summary>重放请求</summary>
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/9f8276ac-e089-427b-97f4-becac250ae5e" />
</details>

<details>
  <summary>编辑或构造请求</summary>
  <img width="1200" alt="image" src="https://github.com/user-attachments/assets/f2a5b088-72b6-4098-8ba6-3e42f15f3ad8" />
</details>

其它界面功能参见完整文档：https://wproxy.org/whistle/webui/

### 规则功能

Whistle 规则可看成是如下系统 hosts 规则的扩展：

``` txt
# 一个域名对应一个 IP
127.0.0.1 localhost
::1 localhost
# 多个域名对应一个 IP
10.2.55.3 www.test.com www.example.com
```

系统 hosts 规则的功能单一，只支持修改 DNS及匹配域名，且有 DNS 缓存问题，无法满足日常工作需求，Whistle 规则扩展了系统 hosts 规则的功能，匹配方式上不仅支持域名匹配、路径匹配、通配符匹配、正则匹配等，还支持通过请求方法，响应状态码、请求（响应）头、请求内容等进一步过滤；功能上不仅支持修改 DNS，还支持修改端口，CNAME，设置代理，修改请求 URL、请求方法、响应状态码、请求头、响应头、请求内容、响应内容等，理论上可以修改 HTTP 请求的所有东西，Whistle 规则格式为：

1. 默认格式

   ``` txt
   pattern operation
   ```

2. 支持匹配多个操作

   ``` txt
   pattern operation1 operation2 ...
   ```

3. 支持过滤器

   ``` txt
   pattern operation1 operation2 ... includeFilter://filterPattern1 ... excludeFilter://filterPatternN ...
   ```

   > 多个 filter 之间是 或 的关系，即满足其中一个条件即可

4. 支持位置调换（前提：operation 与 pattern 不同时为 URL 或域名）

   ``` txt
   operation pattern [filters ...]
   operation pattern1 pattern2 ... [filters ...]
   ```

5. 支持换行

   ``` txt
   line`
   operation
   pattern1
   pattern2 ...
   [filters ...]
   `
   ```

具体例子如下：

##### 修改 DNS（设置 Hosts）

1. 域名匹配

   ``` txt
   www.test.com 127.0.0.1
   # 支持带端口
   www.test.com 127.0.0.1:8080
   # CNAME 功能（端口可选）
   www.test.com host://www.example.com:8181
   ```

   > 与系统 hosts 规则不同的是 Whistle 规则默认采用**从左到右的映射方式**，**从上到下的优先级**，但在 operation 与 pattern 不同时为 URL 或域名情况下可调换位置，所以也兼容系统 hosts 规则，即：`127.0.0.1:8080 www.test.com`

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
   ```

##### 修改表单数据

``` txt
# 修改表单里面的 `test` 字段的值
pattern reqMerge://test=123

# 删除表单里面的 `abc` 字段
pattern delete://reqBody.abc
```

#####  设置跨域响应头

``` txt
# 以路径匹配为例，设置跨域响应头 Access-Control-Allow-Origin: *，且排除 OPTION 请求
pattern resCors://* excludeFilter://m:option
```


所有规则参见完整文档：https://wproxy.org/whistle/rules/

### 安装插件

插件需通过命令行安装：

``` sh
w2 i whistle.inspect whistle.vase
```

> 上述插功能介绍及源码：[https://github.com/whistle-plugins](https://github.com/whistle-plugins)，客户端可通过界面安装 ：[https://github.com/avwo/whistle-client](https://github.com/avwo/whistle-client)

安装后即可在管理界面的 Plugins 看到这两个插件：

<details>
  <summary>插件列表示例图</summary>
  <img width="1000" alt="image" src="https://github.com/user-attachments/assets/ec018691-c7a9-415e-9809-bf079694c024" />
</details>

每个插件默认可以新增两个规则协议：

``` txt
whistle.inspect://xxx
inspect://xxx
```

> 通过配置插件的自定义规则，可将匹配的请求转发到插件指定 hook 实现自定义功能，如果不需要也可通过插件的 `package.json ` 的 ` whistleConfig` 设置 `"hideLongProtocol": true` 或 `"hideShortProtocol": true` 隐藏对应规则协议

除了扩展规则，插件还支持扩展 Whistle 界面，以及提供操作界面、自带规则等功能，关于插件的安装、使用、开发参见完整文档：https://wproxy.org/whistle/plugins.html

# License

[MIT](./LICENSE)

