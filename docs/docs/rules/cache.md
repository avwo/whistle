# cache

`cache` 协议用于快速设置响应的缓存控制头，帮助控制浏览器和服务器的缓存行为。可以为匹配的响应设置缓存策略，包括：
- 设置固定的缓存时间
- 禁用缓存（`no-cache`）
- 完全禁止存储（`no-store`）

这可以帮助优化网站性能或确保特定资源不会被缓存。

## 规则语法

`cache` 支持多种方式设置缓存策略：

### 1. 内联值（直接指定）
直接在规则中指定缓存策略。
```txt
# 设置缓存5秒，支持正整数、0、负整数
pattern cache://5 [lineProps...] [filters...]

# 设置缓存头：`cache-control: no-cache`、`pragma: no-cache`
# `no-cache` 可简写为 `no`
pattern cache://no-cache [lineProps...] [filters...]

# 设置缓存头：`cache-control: no-store`、`pragma: no-cache`
pattern cache://no-store [lineProps...] [filters...]
```

**示例：**
```txt
https://example.com/api/data cache://no-cache
https://example.com/static/js cache://86400  # 缓存24小时
```

### 2. 内嵌值（使用代码块）
当需要复用缓存策略或策略较复杂时可使用此方式。
````txt
pattern cache://{custom-key} [lineProps...] [filters...]

``` custom-key
no-cache
```
````

### 3. 引用 Values 中的值
引用在界面 `Values` 中预先定义好的缓存策略。
```txt
pattern cache://{key-of-values} [lineProps...] [filters...]
```
**前提：** 在 `Values` 中存在一个名为 `key-of-values` 的键，其值为缓存策略。

### 4. 文件/远程 URL 加载
**当前不支持** 从本地文件或远程 URL 动态加载缓存配置。


## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 缓存策略值：<br>• **数字**：缓存秒数（如 `60` 表示缓存60秒）<br>• **no-cache** 或 **no**：允许缓存但每次需重新验证<br>• **no-store**：完全禁止缓存<br>• 支持内联、内嵌、Values 引用<br>• ⚠️ 不支持从文件或远程 URL 加载 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

**影响的响应头：**
- `Cache-Control`
- `Expires`
- `Pragma`

## 缓存策略说明

| 策略 | 含义 | 典型使用场景 |
| :--- | :--- | :--- |
| **数字（如 `60`）** | 设置资源缓存指定秒数 | 静态资源、不经常变化的API响应 |
| **no-cache**（或 **no**） | 允许缓存但每次使用前必须验证 | 经常变化的内容，如用户数据、实时报价 |
| **no-store** | 完全禁止缓存任何版本 | 敏感数据、支付页面、一次性令牌 |

## 配置示例

### 基础示例
```txt
# 静态资源缓存1小时
https://example.com/static cache://3600

# API接口禁用缓存
https://example.com/api cache://no-cache

# 敏感数据禁止缓存
https://example.com/account cache://no-store
```

### 使用内嵌值
````txt
https://example.com/reports cache://{report-cache-policy}

``` report-cache-policy
no-cache
```
````

### 配合过滤器使用
仅对特定响应状态码设置缓存：
```txt
https://example.com/api  cache://300 includeFilter://s:200
```

### 引用 Values 中的配置
假设在 Values 中已有 `static-cache` 配置：
```txt
https://example.com/assets cache://{static-cache}
```


## 工作原理与关联协议

1. **核心原理**：`cache` 协议自动设置相应的缓存控制头：

   - `cache://5` 设置：
     ```http
     Cache-Control: max-age=5
     Expires: [当前时间+5秒]
     ```
   
   - `cache://no-cache` 设置：
     ```http
     Cache-Control: no-cache
     Pragma: no-cache
     ```
   
   - `cache://no-store` 设置：
     ```http
     Cache-Control: no-store
     Pragma: no-cache
     ```

2. **关联协议**：
   - **禁用缓存**：更彻底的缓存禁用方案，同时移除请求和响应中的缓存相关头。详见：[disable://cache](./disable)
   - **手动设置头部**：对于更复杂的缓存控制，可以使用 [`resHeaders`](./resHeaders) 协议手动设置缓存头。

## 注意事项
- 缓存时间以秒为单位，不支持小数
- 设置 `no-cache` 不代表"不缓存"，而是"使用前必须验证"
- 对于需要完全禁用缓存的场景，建议同时使用 [`disable://cache`](./disable) 协议
- 实际缓存行为还受服务器配置和浏览器实现的影响
