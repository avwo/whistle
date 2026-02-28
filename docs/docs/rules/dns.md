# dns
对匹配的请求使用指定的 DNS 服务器进行域名解析，支持传统 DNS 和安全 DNS (DoH)。

## 规则语法
``` txt
pattern dns://dnsServer [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | DNS 服务器地址，支持两种形式：<br/>• **传统 DNS**：IP 或 IP:端口<br/>• **安全 DNS (DoH)**：`https://` 开头的 DoH 服务 URL | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## value 参数说明

| 类型               | 格式         | 示例                                                                    |
| ------------------ | ------------ | ----------------------------------------------------------------------- |
| 传统 DNS           | IP 或 IP:端口 | `8.8.8.8`、`8.8.8.8:53`、`[::1]:53`                                     |
| **安全 DNS (DoH)** | HTTPS URL    | `https://dns.google/dns-query`、`https://cloudflare-dns.com/dns-query`   |

## 配置示例

``` txt
# 使用传统 DNS
example.com dns://8.8.8.8
*.google.com dns://8.8.8.8:53

# 使用安全 DNS (DoH) - Google
*.google.com dns://https://dns.google/dns-query

# 使用安全 DNS (DoH) - Cloudflare
example.com dns://https://cloudflare-dns.com/dns-query
```

## 与 host 的关系

- **host**：直接映射域名到 IP，相当于修改 hosts 文件
- **dns**：指定使用哪个 DNS 服务器来解析域名

当请求同时匹配 `host` 和 `dns` 时：
- 若 `host` 直接映射到 IP，则无需 DNS 解析，`dns` 规则不生效
- 若 `host` 映射到域名（CNAME），则使用 `dns` 规则指定的服务器解析该域名
