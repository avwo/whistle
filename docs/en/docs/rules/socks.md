# socks
`socks` 指令用于将匹配的请求通过指定的 SOCKS5 代理服务器转发。

## 规则语法
``` txt
pattern socks://ipOrDomain[:port] [filters...]
```
> `port` 可选，不填则使用默认端口 `443`

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | IP + 可选端口 或域名 + 可选端口<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 将请求代理到 SOCKS5 代理: `127.0.0.1:443`
www.example.com/path socks://127.0.0.1 # 默认端口 443

# 将当前域名的所有请求代理到 SOCKS5 代理: `127.0.0.1:8080`
www.example.com socks://127.0.0.1:8080

# 也可以用域名
www.example.com/path socks://test.proxy.com # 默认端口 443
www.example.com socks://test.proxy.com:8080
```

## 高级用法
默认情况下，上游代理会自行解析请求的域名。但某些场景下，你可能希望强制代理直接访问指定的目标 IP（跳过 DNS 解析），例如：
- 绕过 DNS 污染
- 直接访问特定后端 IP
- 测试不同环境的服务
``` txt
# 通过查询参数
www.example.com socks://127.0.0.1:8080?host=1.1.1.1
www.example.com socks://127.0.0.1:8080?host=1.1.1.1:8080

# 通过指令启用
www.example.com socks://127.0.0.1:8080 1.1.1.1 enable://proxyHost
www.example.com socks://127.0.0.1:8080 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` 等价于 `host://1.1.1.1`
