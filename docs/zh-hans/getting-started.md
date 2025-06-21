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


完整功能参见：[界面功能](/zh-hans/gui/network)

## 规则配置示例

<img width="1000" alt="set rules" src="/img/rules.png" />

Whistle 通过简单的规则配置修改请求/响应，基本语法结构如下：

``` txt
pattern operation [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**规则由三个核心组件构成：**
1. **匹配模式** (`pattern`)，匹配请求 URL 的表达式，支持多种格式：
   - 域名匹配：`www.test.com`（匹配该域名所有请求，含端口）
   - 路径匹配：`www.test.com/path`
   - 正则表达式：`/^https?://test\.com//i`
   - 通配符：`*.test.com`、`**.test.com/path`
    > Whistle 有三种 URL 类型：
    > 1. **隧道代理：**`tunnel://domain[:port]`
    > 2. **WebSocket：**`ws[s]://domain[:port]/path/to`
    > 3. **普通 HTTP：**`http[s]://domain[:port]/path/to`
    >
2. **操作指令** (`operation`)，格式：`protocol://value`
   - `protocol`：操作类型，如：
     - `reqHeaders`：修改请求头
     - `resHeaders`：修改响应头
   - `value`：操作内容，支持多种数据源：
     - 内联值：`reqHeaders://x-proxy-by=whistle`（直接添加请求头）
     - 本地文件：`file://path/to/file`
     - 远程资源：`https://example.com/data.json`
     - 预设变量：`{key}`（从 Rules 里面的内嵌值 或 Values 读取）
    > **operation** 里面的 `protocol://` 在以下两种场景时可以省略：
    > - `ip` 或 `ip:port`：等价于 `host://ip` 或 `host://ip:port`
    > - `D:\path\to`、`/path/to` 或 `{key}`：等价于 `file://D:\path\to`、`file:///path/to` 或 `file://{key}`
    >
3. **过滤条件（可选）** (`includeFilter/excludeFilter`)
   - 逻辑关系：多条件间为「或」匹配，只要匹配其中一个过滤条件就成立
   - 匹配范围：
     - 请求：URL、方法（GET/POST等）、头部字段、内容、客户端 IP
     - 响应：状态码、头部字段、内容、服务端 IP

#### 示例1：修改 DNS（设置 Hosts）

1. 域名匹配

   ``` txt
   www.test.com 127.0.0.1
   # 支持带端口
   www.test.com 127.0.0.1:8080
   # CNAME 功能（端口可选）
   www.test.com host://www.example.com:8181
   ```
2. 路径匹配

   ``` txt
   www.test.com/path/to 127.0.0.1:8080
   # 支持带协议
   https://www.test.com/path/to 127.0.0.1:8080
   # 只作用于隧道代理请求
   tunnel://* 127.0.0.1:8080
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

   >  `*`、`**`、`***` 匹配的范围不同，参见文档：[pattern](/zh-hans/rules/pattern)

4. 正则匹配

   ``` txt
   # 规则正则表达式里面的 `/` 转不转义都可以
   /^https?://\w+\.test\.com/ 127.0.0.1:8080
   ```
    > `/regexp/x` 等价于 `new RegExp(regexp, x)`
5. 过滤匹配

   ``` txt
   # 请求 URL 匹配 `pattern` 且请求头 `cookie` 包含 `env=test`
   pattern 127.0.0.1:8080 includeFilter://reqH.cookie=/env=test/
   # 只对 iPhone 发起的该请求生效
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
# 设置跨域响应头 Access-Control-Allow-Origin: *，且排除 OPTION 请求
pattern resCors://* excludeFilter://m:option
# 非 `*` 的跨域请求头
pattern resCors://enable
```

## 规则高级配置

1. 组合配置
    ``` txt
    pattern operation1 operation2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
    ```
2. 位置调换（`pattern1` 和 `operation` 不同时为 URL 或域名）
   > 即不同时为形如 `https://test.com/path`、`//test.com/path`、`test.com/path`、`test.com` 的 URL 或域名
    ``` txt
    operation pattern1 pattern2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
    ```
3. 换行配置
    ``` txt
    line`
    operation
    pattern1
    pattern2
    ...
    [includeFilter://pattern1
    ...
    excludeFilter://patternN 
    ...]
    ```
    > Whistle 会自动将代码块里面的换行符自动替换成空格

    完整功能参见：[规则配置](/zh-hans/rules/pattern)
