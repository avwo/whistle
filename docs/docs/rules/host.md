# host
修改请求的 DNS 解析结果，将指定请求解析到特定 IP 地址（域名）及端口，可以看作终极版的系统 hosts 配置功能。

## 规则语法
``` txt
pattern host://ipOrDomain[:port] [filters...]
```
> `port` 如果不填，则沿用请求 URL 的原始端口，如果是指向域名则相当于 `cname` 功能

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | IP + 可选端口 或域名 + 可选端口<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


## 配置示例
``` txt
# 如果只是 IP 或端口可以省略 `host://`
www.example.com/test0 127.0.0.1      # 不改端口，沿用请求 URL 的原始端口
www.example.com/test1 127.0.0.1:5173

# CNAME 功能
www.example.com/test2 host://www.test.com
www.example.com/test3 host://www.test.com:8080

# 高级配置，从请求参数获取目标地址，includeFilter 确保存在该参数
www.example.com/test4 host://`${query.target}$:8080` includeFilter:///[?&]target=[\w-]+/i
```
## 与 proxy 的匹配优先级
以下是优化后的文档，结构更清晰，语言更简洁准确：

---

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
`host` 协议仅对经过规则替换后生成的 `Final URL`（可在 Overview 面板中查看）生效。若 `Final URL` 为空，则会作用于原始请求的 URL。

例如以下规则：

``` txt
www.example.com/api www.example.com 127.0.0.1:1234
```

当请求 `https://www.example.com/api/path` 时，Whistle 会先将其转换为 `https://www.example.com/path`（该结果即为 `Final URL`）。此时希望将该请求指向 `127.0.0.1:1234`，但由于 `host` 规则仅匹配替换前的原始域名 `www.example.com/api`，而转换后的 `Final URL` 已经是 `www.example.com/path`，因此无法命中这条 `host` 规则。

若需要对替换后的请求也生效，可拆解为两条规则：

``` txt
www.example.com/api www.example.com
www.example.com 127.0.0.1:1234
```

这样，原始请求先被第一条规则重写，生成新的 `Final URL`，然后再被第二条 `host` 规则匹配，最终指向 `127.0.0.1:1234`。


## 常见问题
1. 与 URL 转换的区别：
    ``` txt
    # 服务端收到的 URL 还是 www.example.com
    www.example.com 127.0.0.1:5173

    # 服务端收到的 URL 是 http://127.0.0.1:5173
    www.example.com http://127.0.0.1:5173
    ```
2. 自动降级为 HTTP 请求：如果配置的目标 IP 为 `127.0.0.1`，且 HTTPS 请求报错会自动降级为 HTTP 请求，方便访问本地服务，用户可以通过以下规则禁用该功能：
    ``` txt
    # 禁用本地 HTTPS 自动降级
    pattern disable://auto2http
    ```
