# 快速上手

安装完成后
- **客户端版本**：直接启动桌面应用程序
- **命令行版本**：在浏览器中访问 http://local.whistlejs.com

即可进入操作界面：

<img width="1000" alt="network" src="/img/whistle.png" />

操作界面主要功能：
- **Network**：实时抓包分析与请求重放/编辑等界面
- **Rules**：修改请求/响应的规则配置界面
- **Values**：操作内容配置界面（支持规则变量调用）
- **Plugins**：插件管理界面

## 界面操作示例

1. 重放请求
   > 点击请求并点击顶部 `Replay` 按钮，或请求列表右键菜单 Actions -> Replay
   
   <img width="720" alt="replay request" src="/img/replay-req.png" />
2. 编辑或构造请求
   > 点击请求并点击顶部 `Edit` 按钮，或请求列表右键菜单 Actions -> Edit Request
   
   <img width="1000" alt="edit request" src="/img/edit-req.png" />

## 规则简介

<img width="1000" alt="set rules" src="/img/rules.png" />

Whistle 通过配置简洁的规则，即可高效地修改与调试网络请求和响应。其所有规则都基于一个核心语法结构：

``` txt
pattern operation [lineProps...] [filters...]
```

**规则解读**：当一个请求的 URL 与 `pattern` 匹配时，Whistle 就会对其执行 `operation` 所定义的操作。此外，您还可以：
- 通过可选的 `lineProps` 为当前同一行的规则设置特殊属性
- 通过可选的 `filters` 对已匹配的请求进行二次筛选

| 名称      | 功能                                                         |
| --------- | ------------------------------------------------------------ |
| pattern   | 匹配请求 URL 的表达式（支持域名、路径、正则、通配符）：<br/>1.  `www.test.com`（域名）<br/>2. `https://www.test.com`（带协议域名）<br/>3. `www.test.com:8080`（带端口域名）<br/>4. `*.test.com`（带通配符域名）<br/>5. `www.test.com/path`（路径）<br/>6.  `https://www.test.com/path`（带协议路径）<br/>7.  `www.test.com/path?query`（带参数域名）<br/>8. `/api/i`（正则表达式）<br />9. ``^**.test.com/path/index.*.js``（通配符）<br />10. ``^https://**.test.com/path/index.*.js``（带协议通配符） |
| operation | 要执行的具体操作，格式为 `操作协议://操作内容`：<br/>1. `reqHeaders://x-proxy=whistle`（设置请求头）<br/>2. `file:///User/xxx`（映射到本地文件） |
| lineProps | 仅对当前规则生效的附加配置，用于提升规则优先级、细化匹配规则功能等行为（支持组合使用）：<br/>1. `lineProps://important`（提升当行规则优先级）<br/>2. `lineProps://safeHtml`（确保响应内容不是 JSON 对象）<br/>3. `lineProps://proxyHost`（让 `proxy` 和 `host` 协议同时生效） |
| filters   | 在 pattern 匹配的基础上进行更精确的筛选（支持组合使用）：<br/>1. `includeFilter://b:cmdname=xxx`（保留请求体中含 `cmdname=xxx` 的请求，不区分大小写）<br/>2. `excludeFilter://reqH.user-agent=/android/i`（排除 User-Agent 包含 android 的请求，不区分大小写） |


我们先从几个常见功能开始，直观感受 Whistle 规则的基本用法，详细解读稍后说明。

## 本地替换

在开发或问题排查过程中，经常需要将页面的静态资源、接口等请求转发到本地环境或指定的测试服务器。通过 Whistle 规则，可以方便地实现这类映射与代理。

```txt
# 1. 将页面请求转发到本地开发服务
www.example.com http://localhost:5173 excludeFilter://*/static excludeFilter://*/api

# 2. 将静态资源映射到本地文件目录
www.example.com/static file:///User/xxx/statics

# 3. 将接口请求转发到测试环境服务器
www.example.com/api 10.1.0.1:8080
```

#### 规则说明

| 规则 | 作用 | 注意事项 |
|------|------|----------|
| `www.example.com/static file:///User/xxx/statics` | 将 `www.example.com/static/…` 路径下的所有请求映射到本地的 `/User/xxx/statics/…` 目录。 | 若本地无对应文件，会返回 404 错误。 |
| `www.example.com/api 10.1.0.1:8080` | 将所有 `www.example.com/api/…` 的请求转发到测试服务器 `10.1.0.1:8080`。 | 转发后服务器收到的 URL 不变，仅主机和端口部分被替换。 |
| `www.example.com http://localhost:5173 excludeFilter://*/static excludeFilter://*/api` | 将 `www.example.com` 的其他请求（除 static 和 api 路径外）全部转发到本地服务 `localhost:5173`。 | 该规则会将 **http 与 https** 请求都转发到 `http://localhost:5173`，服务器获取到的 URL 为转发后的地址。 |

根据实际开发环境调整上述规则中的域名、本地路径或测试服务器地址即可快速实现请求转发，提升开发与调试效率。
## 修改请求/响应内容
在开发或调试时，将线上请求指向本地或测试环境。

```txt
# 场景一：将整个站点代理到本地开发服务器（排除静态和API路径）
www.example.com http://localhost:5173 excludeFilter://*/static excludeFilter://*/api

# 场景二：将特定路径的静态资源映射到本地目录
www.example.com/static file:///User/xxx/statics

# 场景三：将 API 接口转发到测试服务器
www.example.com/api 10.1.0.1:8080
```

**关键区别**：
*   `file://`：将请求映射到**本地文件系统**，若文件不存在则返回404。
*   `http://` 或 `ip:port`：将请求**代理转发**到另一台服务器，服务器看到的是原始URL。

## 远程调试：查看 DOM 与日志

使用内置的 **weinre** 和 **log** 协议，远程调试页面。

```txt
# 同时启用远程DOM调试(weinre)和日志捕获(log)
https://www.qq.com weinre://test log://
```

1.  **访问 weinre 调试器**：启动规则后，将鼠标悬停在顶部菜单 `Weinre` 上，点击会话名（如 `myDebugSession`）即可打开调试界面。
    <img src="/img/weinre-menu.png" alt="打开weinre菜单" width="360" />
2.  **开始调试**：在浏览器中访问目标页面（如 `https://www.qq.com`），在 weinre 界面选择该页面，即可像使用浏览器开发者工具一样检查 **Elements**、**Console** 等。
    <img src="/img/weinre-main.png" alt="weinre主界面" width="800" />
3.  **查看完整日志**：所有页面 Console 输出及 JavaScript 错误会同步显示在 Whistle 主控制台的 **Network → 右侧 Tools → Console** 标签页中。
    ![log功能演示](/img/log-basic.gif)
  
## 详细文档
1. **[界面功能详解](./gui/network)**：深入了解 Network 等面板的所有功能。
2. **[规则配置全集](./rules/rule)**：查阅所有支持的规则协议和高级用法。
