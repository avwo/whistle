# rawfile
rawfile 是 [file](./file) 的增强版本，除了支持 [file](./file) 的所有功能外，还允许在文件中定义完整的 HTTP 响应，包括：
- 响应状态码
- 响应头部
- 响应内容

## 规则语法
``` txt
pattern rawfile://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## Mock 接口
1. 本地文件 `/User/xxx/raw.txt`
    ``` js
    HTTP/1.1 500 OK
    Content-Type: application/json
    X-Custom-Header: value

    {
      "status": "success",
      "data": "your content here"
    }
    ```
2. 配置规则
    ``` txt
    https://www.example.com/test/rawfile tpl:///User/xxx/raw.txt

    # 等价于
    #  https://www.example.com/test/rawfile file:///User/xxx/test.json replaceStatus://500 resType://json resHeaders://x-custom-header=value
    
    # 支持远程 URL
    # pattern rawfile://https://example.com/raw.json
    ```
3. 请求 `https://www.example.com/test/rawfile` 返回结果：
    ``` txt
    // 状态码
    500

    // 响应头
    content-type: application/json
    x-custom-header: value
    content-length: 56

    // 响应内容
    {
      "status": "success",
      "data": "your content here"
    }
    ```

其它功能参考：[file](./file)
