# style

自定义 Network 列表中请求行的显示样式，包括字体颜色、样式、背景色等。

## 规则语法
``` txt
pattern style://color=@value&fontStyle=value&bgColor=@value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 支持的样式属性：<br/>• `color` - 字体颜色（`@hex` 或 CSS 颜色名，如 `red`）<br/>• `fontStyle` - 字体样式（如 `italic`、`bold`）详见 [font-style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)<br/>• `bgColor`- 背景颜色（@hex 或 CSS 颜色名，如 `red`） |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.test.com style://color=@fff&fontStyle=italic&bgColor=red
```
<img src="/img/style.png" width="1000" />
