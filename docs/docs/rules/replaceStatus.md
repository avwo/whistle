# replaceStatus

`replaceStatus` 协议用于替换 HTTP 状态码，在请求响应完成后将原始状态码替换成指定的 HTTP 状态码。通过 `replaceStatus` 协议，你可以：
- **修改服务器响应的状态码**：基于真实服务器响应进行状态码替换
- **测试不同状态码的处理逻辑**：在不修改后端代码的情况下测试各种状态码场景
- **错误场景模拟**：将正常响应转换为错误状态码，测试客户端容错能力
- **重定向测试**：修改重定向状态码或目标

## 规则语法

`replaceStatus` 协议支持多种方式配置：

### 1. 内联值（直接指定）
直接在规则中写明要替换的状态码。

```txt
pattern replaceStatus://code [lineProps...] [filters...]
```
**示例：**
```txt
www.example.com/api/old replaceStatus://301
```

### 2. 内嵌值（使用代码块）
当需要根据条件返回不同状态码，或希望复用配置时可使用此方式。

````txt
pattern replaceStatus://{custom-key} [lineProps...] [filters...]

``` custom-key
404
```
````

### 3. 引用 Values 中的值
引用在界面 `Values`（中央配置区）中预先定义好的状态码。

```txt
pattern replaceStatus://{key-of-values} [lineProps...] [filters...]
```
**前提**：在 `Values` 中存在名为 `key-of-values` 的键，其值为状态码。

### 4. 文件/远程 URL 加载
**当前不支持** 从本地文件或远程 URL 动态加载内容。

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **code** | 是 | 要替换的 HTTP 响应状态码，如：<br>• `200` OK<br>• `301` 永久重定向<br>• `302` 临时重定向<br>• `404` 未找到<br>• `500` 服务器错误<br>• 支持所有标准 HTTP 状态码 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

## 配置示例

### 基础示例
```txt
# 将任何响应替换为 404 状态码
www.example.com replaceStatus://404

# 将服务器错误替换为正常状态码
www.example.com/api replaceStatus://200 includeFilter://s:500

# 修改重定向状态码
www.example.com/redirect replaceStatus://307
```

### 模拟认证失败
```txt
# 将正常响应替换为 401 状态码，触发浏览器认证弹窗
www.example.com/secure-page replaceStatus://401

# 禁止弹出登录框，直接返回 401
www.example.com/secure-page replaceStatus://401 disable://userLogin

# 或使用 lineProps 达到同样效果
www.example.com/secure-page replaceStatus://401 lineProps://disableUserLogin
```

### 条件替换
```txt
# 仅当原始状态码为 200 时替换为 500
www.example.com/api replaceStatus://500 includeFilter://s:200

# 仅替换特定路径的响应状态码
www.example.com/api/admin replaceStatus://403

```

### 配合其他协议使用
````txt
# 替换状态码并修改响应内容
www.example.com/api/error replaceStatus://500 resBody://{errMsg}

``` errMsg
{"message":"Custom error message"}
```

# 替换为 301 重定向并设置新的 Location 头
www.example.com/old-url replaceStatus://301 resHeaders://location=https://www.example.com/new-url
````

### 使用内嵌值
````txt
``` maintenance-status
503
```

# 将网站所有响应替换为维护状态
www.example.com replaceStatus://{maintenance-status}
````

### 环境特定配置
```txt
# 仅在测试环境模拟错误
test.example.com/api replaceStatus://500

# 开发环境保持原样
# dev.example.com/api (不设置 replaceStatus)
```

## 常见使用场景

### 1. 错误处理测试
```txt
# 测试客户端对服务器错误的处理
www.example.com/api replaceStatus://500 includeFilter://chance:0.1
```

### 2. 重定向行为测试
```txt
# 测试永久重定向缓存
www.example.com/old-page replaceStatus://301

# 测试临时重定向
www.example.com/temp-redirect replaceStatus://302
```

### 3. 认证授权测试
```txt
# 测试未认证访问
www.example.com/protected replaceStatus://401

# 测试权限不足
www.example.com/admin replaceStatus://403
```

### 4. 限流测试
```txt
# 测试请求过多场景
www.example.com/api/rate-limited replaceStatus://429 resHeaders://retry-after=60
```

### 5. 维护模式测试
```txt
# 测试维护页面
www.example.com replaceStatus://503 resBody://(<h1>系统维护中...</h1>)
```

## 与 statusCode 的区别

`replaceStatus` 协议与 [`statusCode`](./statusCode) 协议的主要区别在于处理时机：
- **`replaceStatus`**：**先请求后端服务器**，收到响应后替换状态码
- **`statusCode`**：**不请求后端服务器**，立即返回指定的状态码


## 注意事项

### 1. 与 statusCode 的区别
- **处理时机**：`replaceStatus` 在响应阶段生效，`statusCode` 在请求阶段生效
- **服务器访问**：`replaceStatus` 会访问服务器，`statusCode` 不会
- **使用场景**：需要真实服务器数据时用 `replaceStatus`，完全模拟时用 `statusCode`

### 2. 响应内容保留
- 默认情况下，替换状态码时响应内容保持不变
- 可通过配合 [`resBody`](./resBody) 协议修改响应内容

### 3. 认证弹窗控制
- 替换为 `401` 状态码时，默认会触发浏览器认证弹窗
- 可通过以下方式禁用弹窗：
  - 添加 `disable://userLogin`
  - 添加 `lineProps://disableUserLogin`
  - 使用 [`enable`](./enable) 协议的反向配置

### 4. 重定向处理
- 替换为重定向状态码（301、302 等）时，通常需要配合修改 `Location` 响应头
- 否则客户端可能无法正确处理重定向

### 5. 状态码兼容性
- 确保替换的状态码与响应内容兼容
- 例如：不应将 HTML 页面替换为 204（无内容）状态码

## 高级用法

### 状态码转换映射
```txt
# 将所有重定向统一为 302
www.example.com replaceStatus://302 includeFilter://s:301
```

### 概率性替换
```txt
# 10% 的概率将响应替换为错误
www.example.com/api replaceStatus://500 inclideFilter://chance:0.1
```

### 组合多个规则
```txt
# 针对不同原始状态码进行不同替换
www.example.com/api replaceStatus://200 includeFilter://s:404
www.example.com/api replaceStatus://400 includeFilter://s:403
```

## 故障排除

### Q: 状态码替换没有生效
**A:** 检查：
1. 规则 pattern 是否正确匹配请求 URL
2. 是否有其他更高优先级的规则覆盖
3. 过滤器条件是否满足（特别是对原始状态码的过滤）

### Q: 响应内容与状态码不匹配
**A:** 检查：
1. 是否同时修改了响应内容
2. 响应头是否与新状态码兼容
3. 客户端是否能正确处理该状态码

### Q: 浏览器弹出认证窗口
**A:** 对于 401 状态码：
1. 检查是否添加了 `disable://userLogin` 或 `lineProps://disableUserLogin`
2. 确认规则顺序是否正确

### Q: 重定向循环
**A:** 检查：
1. 是否设置了正确的 `Location` 头
2. 重定向目标是否正确
3. 是否有多个重定向规则冲突

## 关联协议

1. **直接返回状态码**：[statusCode](./statusCode)
   - 不请求服务器，直接返回指定的状态码

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
