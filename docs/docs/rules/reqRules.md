# reqRules
为匹配的请求批量设置多个规则，实现复杂场景下的请求处理需求。

## 规则语法
``` txt
pattern reqRules://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 规则内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
``` test.txt
* file://(<div>hello<div>)
* resType://text
```

``` test2.txt
* resAppend://(test)
```

www.example.com/path reqRules://{test.txt} reqRules://{test2.txt}
````
访问 `https://www.example.com/path/to` 返回内容：
``` txt
<div>hello<div>test
```
## 关联协议
1. 请求阶段脚本规则：[reqScript](./reqScript)
2. 响应阶段批量规则：[resRules](./resRules)
3. 响应阶段脚本规则：[resScript](./resScript)
4. 更复杂的定制需求：[插件开发](../extensions/dev)
