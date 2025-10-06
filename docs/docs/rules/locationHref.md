# locationHref
针对无法通过服务端重定向（`302`/`301`）的场景，通过在 HTML 页面中返回 JavaScript 代码 `window.location.href = targetUrl` 实现客户端跳转。特别适用于：
- 本地HTML文件加载的APP页面
- 单页应用(SPA)
- 特殊框架开发的混合应用(Hybrid App)

## 规则语法
``` txt
pattern locationHref://targetUrl [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| targetUrl   | 重定向后的 URL，可以是相对路径 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 基础配置
``` txt
www.example.com/path locationHref://https://www.qq.com

www.example.com/path2 locationHref://../abc/123
```
- 访问 `https://www.example.com/path/to` 重定向到 `https://www.qq.com`（不自动拼接路径）
- 访问 `https://www.example.com/path2/to` 重定向到 `https://www.example.com/abc/123`

#### 实现路径拼接
``` txt
# 通配符
^www.example.com/path/*** locationHref://`https://www.example.com/$1`
```
- 访问 `https://www.example.com/path/to?query` 重定向到 `https://www.example.com/to?query`

#### location.replace
若需通过 `location.replace(targetUrl)` 实现无历史记录的页面跳转，可按以下格式配置：
``` txt
www.example.com/path locationHref://replace:https://www.qq.com
```
> 跳转至目标 URL，且当前页面不会存入浏览器历史记录，用户无法通过“返回”按钮回到原页面

## 关联协议
1. `302` 跳转：[redirect](./redirect)

