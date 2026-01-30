# statusCode

`statusCode` 协议用于立即中断请求并返回指定的 HTTP 状态码，不会将请求转发到后端服务器。通过 `statusCode` 协议，你可以：
- **快速模拟特定 HTTP 状态码**：无需真实服务器即可测试各种状态码响应
- **拦截并中断请求**：在请求到达真实服务器前直接返回状态码
- **测试错误场景**：模拟服务器错误、重定向、认证失败等场景
- **控制请求流程**：根据条件决定是否允许请求继续

## 规则语法

`statusCode` 协议支持多种方式配置：

### 1. 内联值（直接指定）
直接在规则中写明要返回的状态码。

```txt
pattern statusCode://code [lineProps...] [filters...]
```
**示例：**
```txt
www.example.com/api/old-endpoint statusCode://410
```

### 2. 内嵌值（使用代码块）
当需要根据条件返回不同状态码，或希望复用配置时可使用此方式。

````txt
pattern statusCode://{custom-key} [lineProps...] [filters...]

``` custom-key
404
```
````

### 3. 引用 Values 中的值
引用在界面 `Values`（中央配置区）中预先定义好的状态码。

```txt
pattern statusCode://{key-of-values} [lineProps...] [filters...]
```
**前提**：在 `Values` 中存在名为 `key-of-values` 的键，其值为状态码。

### 4. 文件/远程 URL 加载
**当前不支持** 从本地文件或远程 URL 动态加载内容。

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **code** | 是 | HTTP 响应状态码，如：<br>• `200` OK<br>• `301` 永久重定向<br>• `302` 临时重定向<br>• `404` 未找到<br>• `500` 服务器错误<br>• 支持所有标准 HTTP 状态码 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |


## 配置示例

### 基础示例
```txt
# 返回 404 状态码（页面未找到）
www.example.com/deleted-page statusCode://404

# 返回 500 状态码（服务器内部错误）
www.example.com/api/error statusCode://500

# 返回 302 重定向
www.example.com/old-url statusCode://302
```

### 模拟认证失败
```txt
# 访问时需要认证，浏览器会弹出登录框
www.example.com/secure-area statusCode://401

# 禁止弹出登录框，直接返回 401
www.example.com/secure-area statusCode://401 disable://userLogin

# 或使用 lineProps 达到同样效果
www.example.com/secure-area statusCode://401 lineProps://disableUserLogin
```

### 配合自定义响应内容
```txt
# 返回 404 状态码并自定义响应内容
www.example.com/missing-page statusCode://404 resBody://(<h1>页面不存在</h1>)
```

### 配合过滤器使用
```txt
# 仅对特定请求方法返回 405（方法不允许）
www.example.com/api/resource statusCode://405 includeFilter://m:PUT

# 根据请求路径匹配返回不同状态码
/^https?://www\.example\.com/user/\d+/profile/ statusCode://403

# 基于请求头条件返回状态码
www.example.com/api statusCode://429 includeFilter://reqH:user-agent=/bot/i
```

### 使用内嵌值
````txt
``` maintenance-status
503
```

www.example.com statusCode://{maintenance-status}
````

### 环境特定配置
````txt
``` testing-403
403
```

# 仅在测试环境返回 403
test.example.com/api/admin statusCode://{testing-403}
````

## 常见状态码场景

| 状态码 | 场景描述 | 典型使用 |
| :--- | :--- | :--- |
| **200** | 成功响应 | 测试正常流程 |
| **301/302** | 重定向 | 测试 URL 跳转逻辑 |
| **400** | 错误请求 | 测试客户端错误处理 |
| **401** | 未认证 | 测试认证流程 |
| **403** | 禁止访问 | 测试权限控制 |
| **404** | 未找到 | 测试资源不存在处理 |
| **429** | 请求过多 | 测试限流逻辑 |
| **500** | 服务器错误 | 测试服务端异常处理 |
| **503** | 服务不可用 | 测试维护页面 |

## 注意事项


### 1. 响应内容
- 默认情况下，`statusCode` 返回的响应内容为空
- 可通过配合 [`resBody`](./resBody) 协议自定义响应内容

### 2. 认证弹窗控制
- 返回 `401` 状态码时，默认会触发浏览器认证弹窗
- 可通过以下方式禁用弹窗：
  - 添加 `disable://userLogin`
  - 添加 `lineProps://disableUserLogin`
  - 使用 [`enable`](./enable) 协议的反向配置

### 3. 重定向处理
- 返回 `301`、`302` 等重定向状态码时，需配合 [`location`](./resHeaders) 响应头指定重定向地址：
  ```txt
  www.example.com/old statusCode://302 resHeaders://location="https://www.example.com/new"
  ```

## 高级用法

### 动态状态码
```txt
# 基于时间返回不同状态码（维护窗口）
www.example.com/api statusCode://503 includeFilter://t:>=00:00&t:<=06:00
```

### 组合使用其他协议
```txt
# 返回 403 并设置自定义错误页面
www.example.com/blocked statusCode://403 resBody://<h1>访问被拒绝</h1> resHeaders://content-type="text/html; charset=utf-8"

# 返回 503 并设置重试时间
www.example.com/down statusCode://503 resHeaders://retry-after="3600"
```

### 测试客户端容错
```txt
# 随机返回不同错误状态码，测试客户端容错能力
www.example.com/api/unstable statusCode://500 includeFilter://chance:0.5
www.example.com/api/unstable statusCode://429 includeFilter://chance:0.3
www.example.com/api/unstable statusCode://200 includeFilter://chance:0.2
```

## 与 replaceStatus 的区别
- **`statusCode`**：在请求阶段生效，**不会转发到后端服务器**
- **`replaceStatus`**：在响应阶段生效，**会先请求后端服务器**，然后替换返回的状态码

## 故障排除

### Q: 状态码规则没有生效
**A:** 检查：
1. 规则 pattern 是否正确匹配请求 URL
2. 是否有其他更高优先级的规则覆盖
3. 过滤器条件是否满足

### Q: 浏览器弹出认证窗口
**A:** 对于 401 状态码：
1. 检查是否添加了 `disable://userLogin` 或 `lineProps://disableUserLogin`
2. 确认规则顺序是否正确

### Q: 客户端显示空白页面
**A:** 检查：
1. 是否设置了自定义响应内容
2. 响应头的 `Content-Type` 是否正确
3. 响应内容编码是否匹配

### Q: 重定向未生效
**A:** 检查：
1. 是否设置了 `Location` 响应头
2. 重定向地址格式是否正确
3. 浏览器是否遵循重定向规则

## 关联协议

1. **替换响应状态码**：[replaceStatus](./replaceStatus)
   - 请求先到达服务器，然后替换返回的状态码

2. **禁止认证弹窗**：[disable](./disable) 或 [lineProps](./lineProps)
   - 禁用 401 状态码触发的浏览器登录弹窗

3. **设置响应内容**：[resBody](./resBody)
   - 为状态码响应添加自定义内容

4. **设置响应头**：[resHeaders](./resHeaders)
   - 为重定向等场景设置必要的响应头

## 扩展阅读

- [HTTP 状态码 MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Status)：了解所有 HTTP 状态码的含义
- [匹配模式文档](./pattern)：详细了解 URL 匹配规则
- [过滤器文档](./filters)：了解更多过滤器功能
