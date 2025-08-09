# wss
将 WebSocket 请求转换为新的 wss 请求（服务端将收到转换后的 WebSocket URL）。
> 只支持 WebSocket 请求 `ws[s]://domain[:port]/[path][?query]`，不支持转换隧道代理和普通 HTTP/HTTPS

## 规则语法
``` txt
pattern wss://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配 WebSocket 请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 目标 URL 格式：`domain[:port]/[path][?query]`<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## WebSocket 转换
``` txt
ws://www.example.com/path1 wss://www.test.com/path/xxx
wss://www.example.com/path2 wss://www.abc.com/path3/yyy
```
1. 自动路径拼接：
    | 原始请求                                  | 转换结果（服务端收到的 URL）              |
    | ----------------------------------------- | ----------------------------------------- |
    | `ws://www.example.com/path1`              | `wss://www.test.com/path/xxx`             |
    | `ws://www.example.com/path1/a/b/c?query`  | `wss://www.test.com/path/xxx/a/b/c?query` |
    | `wss://www.example.com/path2`            | `wss://www.abc.com/path3/yyy`             |
    | `wss://www.example.com/path2/a/b/c?query` | `wss://www.abc.com/path3/yyy/a/b/c?query` |
2. 禁用路径拼接：使用 `< >` 或 `( )` 包裹路径
    ``` txt
    www.example.com/path1 wss://<www.test.com/path/xxx>
    # www.example.com/path1 wss://(www.test.com/path/xxx)
    ```
    | 原始请求                                  | 转换结果（服务端收到的 URL）              |
    | ----------------------------------------- | ----------------------------------------- |
    | `[wss/ws]://www.example.com/path/x/y/z` | `wss://www.test.com/path/xxx` |

只支持转发 WebSocket 请求，其它请求匹配 `wss` 协议结果：
- **隧道代理**：忽略匹配
- **普通 HTTP/HTTPS 请求**：返回 `502`

