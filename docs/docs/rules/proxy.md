# proxy (http-proxy)
`proxy`（或 `http-proxy`）指令用于将匹配的请求通过指定的 HTTP 代理服务器转发。两个指令名称功能完全一致，可互换使用。

## 规则语法
``` txt
pattern proxy://ipOrDomain[:port] [filters...]
# 等效写法：
pattern http-proxy://ipOrDomain[:port] [filters...]
```
> `port` 可选，不填则使用默认端口 `80`

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | IP + 可选端口 或域名 + 可选端口<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 将请求代理到 HTTP PROXY: `127.0.0.1:80`
www.example.com/path proxy://127.0.0.1 # 默认端口 80

# 将当前域名的所有请求代理到 HTTP PROXY: `127.0.0.1:8080`
www.example.com proxy://127.0.0.1:8080

# 也可以用域名
www.example.com/path proxy://test.proxy.com # 默认端口 80
www.example.com proxy://test.proxy.com:8080
```

## 高级用法
将请求代理到上游代理后，默认情况下上游代理会根据请求的域名通过 DNS 获取服务器 IP 再继续请求，如果想让上游代理根据指定 IP及端口继续请求，可以这么处理：
``` txt
# 通过查询参数
www.example.com proxy://127.0.0.1:8080?host=1.1.1.1
www.example.com proxy://127.0.0.1:8080?host=1.1.1.1:8080

# 通过指令启用
www.example.com proxy://127.0.0.1:8080 1.1.1.1 enable://proxyHost
www.example.com proxy://127.0.0.1:8080 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` 等价于 `host://1.1.1.1`

## 与 host 的匹配优先级

#### 默认行为

当请求同时匹配 `host` 和 `proxy` 规则时：
- 仅 `host` 规则生效
- `proxy` 规则自动忽略

#### 修改优先级
| 配置方式 | 语法 | 效果 |
|---------|------|------|
| **优先 proxy** | [`enable://proxyFirst`](./enable) 或 [`lineProps://proxyFirst`](./lineProps) | 仅 `proxy` 生效（覆盖 host） |
| **同时生效** | [`enable://proxyHost`](./enable) 或 [`lineProps://proxyHost`](./lineProps) | `proxy` 和 `host` 同时生效 |

#### 使用建议
- 大多数场景使用默认行为即可
- 需要特殊代理逻辑时才使用 `proxyFirst`
- 需要双重匹配时使用 `proxyHost`

## 注意事项
`proxy` 协议仅对经过规则替换后生成的 `Final URL`（可在 Overview 面板中查看）生效。若 `Final URL` 为空，则会作用于原始请求的 URL。

例如以下规则：

``` txt
www.example.com/api www.example.com proxy://127.0.0.1:1234
```

当请求 `https://www.example.com/api/path` 时，Whistle 会先将其转换为 `https://www.example.com/path`（该结果即为 `Final URL`）。此时希望将该请求代理到 `127.0.0.1:1234`，但由于 `proxy` 规则仅匹配替换前的原始域名 `www.example.com/api`，而转换后的 `Final URL` 已经是 `www.example.com/path`，因此无法命中这条 `proxy` 规则。

若需要对替换后的请求也生效，可拆解为两条规则：

``` txt
www.example.com/api www.example.com
www.example.com proxy://127.0.0.1:1234
```

这样，原始请求先被第一条规则重写，生成新的 `Final URL`，然后再被第二条 `proxy` 规则匹配，最终代理到 `127.0.0.1:1234`。
