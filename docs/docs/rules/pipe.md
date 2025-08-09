# pipe
将 HTTP/HTTPS/WebSocket/TUNNEL 请求/响应数据流交给插件处理。

## 规则语法
``` txt
pattern pipe://plugin-name(pipeValue) [filters...]
```
> `(pipeValue)` 可选，在插件 Hook 可以通过 `req.originalReq.pipeValue` 获取

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| plugin-name(pipeValue)   | 插件名称 + 可选参数 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
tunnel://wwww.example.com pipe://test
tunnel://test-tunnel.example.com pipe://test-pipe-tunnel(abc)

wss://test-ws.example.com/path pipe://test-pipe-ws

https://www.example.com/path pipe://test-pipe-http(123)

```

具体用法参考：[插件开发文档](../extensions/dev.md#pipe)
