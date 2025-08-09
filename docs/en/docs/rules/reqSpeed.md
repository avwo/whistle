# reqSpeed
设置请求 Body 的传输速度(单位：kb/s，千比特/每秒).

## 规则语法
``` txt
pattern reqSpeed://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 传输速度（单位：kb/s，千比特/每秒）<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


## 配置示例
``` txt
# 限制请求内容的传输速度：3kb/s
www.example.com/path reqSpeed://3
```
该规则对 `CONNECT`（TUNNEL 请求）、`UPGRADE`（WebSocket 请求）及响应状态码为 `204` 等无响应 Body 的请求无效
