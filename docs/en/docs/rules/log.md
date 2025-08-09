# log
在页面中注入 JS 代码捕获 JS 异常及 `console.xxx` 日志，并显示在 Whistle 管理界面上。

## 规则语法
``` txt
pattern log://id [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| id   | log ID，普通字符串，用于分组过滤 |                    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


## 配置示例
```txt
www.qq.com log://
```

![log basic](/img/log-basic.gif)

``` txt
ke.qq.com log://ke
news.qq.com log://news
```

![log switch](/img/log-switch.gif)

