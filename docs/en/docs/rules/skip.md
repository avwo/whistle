# skip
跳过指定 `pattern` 或 `operation` 的规则，继续匹配后面的规则。

## 语法规则
``` txt
pattern skip://pattern=patternString skip://operation=operationString [filters...]
```
> 可同时配置多个 `skip`

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 需要忽略的规则表达式：<br/>• pattern=patternString<br/>• operation=operationString<br/>⚠️ 不支持从文件/远程 URL 加载数据 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.example.com/path file:///User/xxx/index1.html
www.example.com/path file:///User/xxx/index2.html

www.example.com/path2/test file:///User/xxx/test1.html
www.example.com/path2 file://</User/xxx/test2.html>

www.example.com/path skip://operation=file:///User/xxx/index1.html
www.example.com/path2/test skip://pattern=www.example.com/path2/test
```

- 访问 `https://www.example.com/path` 返回 `/User/xxx/index2.html` 的内容
    > 没有 `www.example.com/path skip://operation=file:///User/xxx/index1.html` 规则将返回 `/User/xxx/index1.html` 的内容
- 访问 `https://www.example.com/path2/test` 返回 `/User/xxx/test2.html` 的内容
    > 没有 `www.example.com/path2/test skip://pattern=www.example.com/path2/test` 规则将返回 `/User/xxx/test1.html` 的内容

类似协议：[ignore](./ignore)
