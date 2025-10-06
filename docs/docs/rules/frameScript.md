# frameScript
通过 JavaScript 脚本操作 WebSocket 和普通 TCP 请求数据帧。

## 规则语法
``` txt
pattern frameScript://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 生成规则的 JS 脚本，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
``` test-frame.js
// 发送预设数据
ctx.sendToServer('1 = 0x12300000');
ctx.sendToClient('1 = 0x1236666666');

// 处理发往服务端的数据帧
ctx.handleSendToServerFrame = function(buf, opts) {
  // 可以返回空、null、undefined 等
  return (buf + '').replace(/1/g, '***');
};

// 处理发往客户端的数据帧  
ctx.handleSendToClientFrame = function(buf, opts) {
  // 可以返回空、null、undefined 等
  return (buf + '').replace(/1/g, '+++');
};
```

wss://echo.websocket.org/ frameScript://{test-frame.js}
````
访问 `https://echo.websocket.org/.ws` 效果：

 <img width="1200" alt="frame-script" src="/img/frame-script.png" />

#### 可用全局变量

| 变量/方法          | 描述                                                                 |
|--------------------|---------------------------------------------------------------------|
| `url`             | 完整请求URL                                                         |
| `method`          | 请求方法(GET/POST等)                                                |
| `ip`/`clientIp`   | 客户端IP地址                                                       |
| `headers`         | 请求头对象                                                          |
| `rules`           | 规则数组，通过push添加新规则                                        |
| `values`          | 临时值存储对象                                                      |
| `render(tpl,data)`| 微型模板渲染函数                                                    |
| `getValue(key)`   | 获取Values中的值                                                    |
| `parseUrl`        | 同Node.js的`url.parse`                                              |
| `parseQuery`      | 同Node.js的`querystring.parse`                                      |
| `sendToClient(frame, options)` | 发送数据（对象、字符串、Buffer）到客户端，用法见下面示例 |
| `sendToServer(frame, options)` | 发送数据（对象、字符串、Buffer）到服务端，用法见下面示例 |
| `handleSendToClientFrame(buffer, options)` | 处理（过滤或删除）发送到客户端的数据，用法见下面示例 |
| `handleSendToServerFrame(buffer, options)` | 处理（过滤或删除）发送到服务端的数据，用法见下面示例 |

