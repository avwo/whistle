# lineProps
通过规则启用 proxyHost、proxyTunnel、safeHtml 等功能。
> 📌 与 [enable](./enable) 的区别：
>
> `enable` 是全局生效的配置
>
> `lineProps` 只对配置所在行的规则生效

## 规则语法
``` txt
pattern operation lineProps://action1|action2|... [filters...]

# 等效于：
pattern operation lineProps://action1 lineProps://action2 ... [filters...]
```
> `lineProps` 不能单独作为 `operation` 使用，且只对同一行的 `operation` 生效

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| operation   | 操作指令                          | [操作指令文档](./operation)   |
| action  | 具体动作，详见下面的说明 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

- `important`：类型 css 属性的 `!important`，提升规则优先级
- `safeHtml`：是一种安全防护机制，当使用 `htmlXxx`/`jsXxx`/`cssXxx` 向 HTML 页面注入内容时，会先检查响应内容的第一个非空白字符是否为 `{` 和 `[`（JSON 对象开头字符），如果不是才会执行注入操作。这可以有效防止对非标准 HTML 响应（如 JSON 接口）的误注入
- `strictHtml`：是一种安全防护机制，当使用 `htmlXxx`/`jsXxx`/`cssXxx` 向 HTML 页面注入内容时，会先检查响应内容的第一个非空白字符是否为 `<`，如果不是才会执行注入操作。这可以有效防止对非标准 HTML 响应（如 JSON 接口）的误注入
- `disableAutoCors`：禁用 [file](./file) 协议替换请求时自动添加必要的 CORS (跨域资源共享) 头信息
- `disableUserLogin`：禁用设置 [statusCode://401](./statusCode) 时显示登录框
- `enableUserLogin`：设置 [statusCode://401](./statusCode) 是否显示登录框（默认显示，用于关闭 `disable.userLogin`）
- `internal`：将 `proxy`、`socks`、`host` 协议掉规则同时作用于 Whistle 内部请求
- `internalOnly`：将 `proxy`、`socks`、`host` 协议掉规则只作用于 Whistle 内部请求
- `internalProxy`：利用 `proxy`、`socks` 等代理协议将请求转发至其他代理服务器（如另一 Whistle 实例）。启用此功能后，已在第一层代理解密的 HTTPS 请求将以明文形式在代理链中传输，从而上游代理可以直接获取明文数据
- `proxyFirst`：优先使用 [proxy](./proxy) 规则（默认情况下，同时匹配 `host` 和 `proxy`，只有 `host` 生效）
- `proxyHost`：[proxy](./proxy) 和 [host](./host) 同时生效
- `proxyHostOnly`：功能同 `proxyHost`，但如果没有匹配 [host](./host) 则 [proxy](./proxy) 自动失效
- `proxyTunnel`：跟 `proxyHost` 一同使用，让上游代理再次通过隧道代理到上上游的 HTTP 代理，详见下面的示例
- `weakRule`：`weakRule`：默认情况下，当配置了 [file](./file) 等协议时，[proxy](./proxy) 规则会自动失效。通过设置 `weakRule` 属性，可以提升 [proxy](./proxy) 规则的优先级，使其在上述场景中仍然生效

## 配置示例
#### 未使用 `lineProps://important`
``` txt
www.example.com/path file:///User/xxx/important1.html
www.example.com/path file:///User/xxx/important2.html
```
访问 `https://www.example.com/path ` 将匹配 `file:///User/xxx/important1.html`

#### 使用 `lineProps://important`
``` txt
www.example.com/path file:///User/xxx/important1.html
www.example.com/path file:///User/xxx/important2.html lineProps://important
```
访问 `https://www.example.com/path ` 将匹配 `file:///User/xxx/important2.html`

#### 注入文本
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1)) 
www.example.com/path jsPrepend://(alert(1)) 
www.example.com/path cssPrepend://(alert(1)) 
```
访问 `https://www.example.com/path ` 返回响应内容：
``` html
<!DOCTYPE html>
<style>alert(1)</style>
alert(1)
<script>alert(1)</script>test
```

#### 使用 `enable://strictHtml`
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1)) 
www.example.com/path jsPrepend://(alert(1)) enable://strictHtml
www.example.com/path cssPrepend://(alert(1)) 
```
访问 `https://www.example.com/path` 返回响应内容：
``` html
test
```
> `enable://strictHtml` 对所有规则都生效

### 使用 `lineProps://strictHtml`
``` txt
www.example.com/path file://(test) resType://html
www.example.com/path htmlPrepend://(alert(1)) 
www.example.com/path jsPrepend://(alert(1)) lineProps://strictHtml
www.example.com/path cssPrepend://(alert(1)) 
```
访问 `https://www.example.com/path` 返回响应内容：
``` html
<!DOCTYPE html>
<style>alert(1)</style>
alert(1)test
```
> `lineProps://strictHtml` 只对所在行的规则生效
