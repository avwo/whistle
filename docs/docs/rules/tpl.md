# tpl
tpl 是基于 [file](./file) 功能的增强版本，提供了简单的模板引擎功能。

## 规则语法
``` txt
pattern tpl://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 模板规则
1. 取值方式：`{key}` 或  `{{key}}`
2.  `key`：为请求参数里面的属性

## Mock JSONP
1. 本地文件 `/User/xxx/test.js`
    ``` js
    {callback}({
      ec: 0
    });
    ```
2. 配置规则
    ``` txt
    https://www.example.com/test/tpl tpl:///User/xxx/test.js
    
    # 支持远程 URL
    # pattern tpl://https://example.com/template
    ```
3. 请求 `https://www.example.com/test/tpl?callback=test` 返回结果：
    ``` txt
    test({
      ec: 0
    });
    ```

其它功能参考：[file](./file)
