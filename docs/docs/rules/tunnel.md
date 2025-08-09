# tunnel
将隧道代理请求转发新的服务器。
> 只支持隧道代理 `tunnel://domain:port`，不支持转换 WebSocket 请求和普通 HTTP/HTTPS

## 规则语法
``` txt
pattern tunnel://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配 WebSocket 请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 目标 URL 格式：`domain[:port]`<br/>`port` 默认为 `443`<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## TUNNEL 转换
``` txt
tunnel://www.example.com tunnel://www.test.com:5678
tunnel://www.example2.com:8080 tunnel://www.test.com
```
 | 原始请求                                  | 转换结果                                    |
| ----------------------------------------- | ----------------------------------------- |
| `tunnel://www.example.com:443`              | `tunnel://www.test.com:5678`             |
| `tunnel://www.example2.com:8080`   | `tunnel://www.test.com:443` |

TUNNEL 请求不设计自动路径拼接和禁用路径拼接，其它请求匹配 `tunnel` 协议结果：
- **WebSocket 请求**：忽略匹配
- **普通 HTTP/HTTPS 请求**：返回 `502`

