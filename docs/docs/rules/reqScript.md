# reqScript
在请求阶段通过 JavaScript 脚本动态生成规则，实现复杂请求处理逻辑。脚本可以访问请求上下文信息，并动态生成匹配规则。

## 规则语法
``` txt
pattern reqScript://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 生成规则的 JS 脚本，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
``` test.js
if (method === 'GET') {
    rules.push('* resType://text');
    rules.push('* file://(<div>GET-Request</div>)');
} else {
    rules.push('* statusCode://403');
}
```
www.example.com/path reqScript://{test.js}
````
访问 `https://www.example.com/path/to` 返回内容：

#### 可用全局变量

| 变量/方法          | 描述                                                                 |
|--------------------|---------------------------------------------------------------------|
| `url`             | 完整请求URL                                                         |
| `method`          | 请求方法(GET/POST等)                                                |
| `ip`/`clientIp`   | 客户端IP地址                                                       |
| `headers`         | 请求头对象                                                          |
| `body`            | 请求内容(最大16KB)                                                  |
| `rules`           | 规则数组，通过push添加新规则                                        |
| `values`          | 临时值存储对象                                                      |
| `render(tpl,data)`| 微型模板渲染函数                                                    |
| `getValue(key)`   | 获取Values中的值                                                    |
| `parseUrl`        | 同Node.js的`url.parse`                                              |
| `parseQuery`      | 同Node.js的`querystring.parse`                                      |


## 关联协议
1. 请求阶段脚本规则：[reqScript](./reqScript)
2. 请求阶段批量规则：[reqRules](./reqScript)
3. 响应阶段批量规则：[resRules](./resRules)
4. 更复杂的定制需求：[插件开发](../extensions/dev)
