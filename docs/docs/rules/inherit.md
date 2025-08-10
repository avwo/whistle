# 协议继承
[http](./http)/[https](./https)/[ws](./ws)/[wss](./wss)/[tunnel](./tunnel) 都限制了目标 URL 的协议，Whistle 也支持根据请求 URL 的协议自动补全。
## 规则语法
``` txt
pattern //value [filters...]
# 或
pattern value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 目标 URL 格式：`domain[:port]/[path][?query]`<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## HTTP/HTTPS 转换
``` txt
http://www.example.com/path1 www.test.com/path/xxx
https://www.example.com/path2 www.abc.com/path3/yyy
```
1. 自动路径拼接：
    | 原始请求                                  | 转换结果（服务端收到的 URL）              |
    | ----------------------------------------- | ----------------------------------------- |
    | `http://www.example.com/path1`              | `http://www.test.com/path/xxx`             |
    | `http://www.example.com/path1/a/b/c?query`  | `http://www.test.com/path/xxx/a/b/c?query` |
    | `https://www.example.com/path2`            | `https://www.abc.com/path3/yyy`             |
    | `https://www.example.com/path2/a/b/c?query` | `https://www.abc.com/path3/yyy/a/b/c?query` |
2. 禁用路径拼接：使用 `< >` 或 `( )` 包裹路径
    ``` txt
    www.example.com/path1 //<www.test.com/path/xxx>
    # www.example.com/path1 //(www.test.com/path/xxx)
    ```
    | 原始请求                                  | 转换结果（服务端收到的 URL）              |
    | ----------------------------------------- | ----------------------------------------- |
    | `[http/https/wss/ws]://www.example.com/path/x/y/z` | `[http/https/wss/ws]://www.test.com/path/xxx` |

## WebSocket 转换
``` txt
ws://www.example.com/path1 www.test.com/path/xxx
wss://www.example.com/path2 www.abc.com/path3/yyy
```
WebSocket 请求替换成指定的 ws 请求：
| 原始请求                                  | 转换结果（服务端收到的 URL）              |
| ----------------------------------------- | ----------------------------------------- |
| `ws://www.example.com/path1`              | `ws://www.test.com/path/xxx`             |
| `wss://www.example.com/path2/a/b/c?query`  | `wss://www.abc.com/path3/yyy/a/b/c?query`|

同样也支持**自动路径拼接**和**禁用路径拼接**。

## TUNNEL 转换
``` txt
tunnel://www.example.com:443 //www.test.com:123
tunnel://www.example2.com:443 www.test2.com/path
```
| 原始请求                                  | 转换结果（服务端收到的 URL）              |
| ----------------------------------------- | ----------------------------------------- |
| `tunnel://www.example.com:443`              | `tunnel://www.test.com:123`             |
| `tunnel://www.example2.com:443`  | `tunnel://www.test2.com:443`|

