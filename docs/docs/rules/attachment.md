# attachment
设置响应头 `content-disposition` 字段，可以让请求直接变下载。
> 类似 Koa 的 `attachment` 方法：https://koajs.com/

## 规则语法
``` txt
pattern attachment://filename [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| filename   | 下载后显示的文件名称，如 `test.txt` <br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
https://www.example.com/ attachment://example.html
```

浏览器访问 `https://www.example.com/` 自动下载 `example.html` 文件。

## 关联协议
1. 直接修改请求头：[resHeaders://content-disposition=attachment;filename="example.html"](./resHeaders)
