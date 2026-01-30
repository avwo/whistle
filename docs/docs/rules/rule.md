# 规则语法

Whistle 通过简洁的规则配置来修改请求和响应，每条规则都遵循相同的基础语法结构。

## 语法结构

```txt
pattern operation [lineProps...] [filters...]
```

每条规则由以下四部分组成：

| 组成部分 | 是否必填 | 描述 |
| :--- | :--- | :--- |
| **pattern** | 是 | 匹配请求 URL 的表达式，详细文档：[pattern](./pattern) |
| **operation** | 是 | 操作指令，格式为 `protocol://value`，详细文档：[operation](./operation) |
| **lineProps** | 否 | 附加配置，仅对当前规则生效，详细文档：[lineProps](./lineProps) |
| **filters** | 否 | 过滤条件，用于精确控制规则生效场景，详细文档：[filters](./filters) |

## 规则高级配置

### 1. 组合配置
单条规则可以包含多个操作指令，实现复杂的功能组合。

**语法**：
```txt
pattern operation1 operation2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**示例**：
```txt
www.example.com/* file:///static-files cache://3600 resCors://*
```

**说明**：
- 多个操作指令按顺序执行
- 支持任意数量的操作指令组合
- 过滤器条件对整条规则生效

### 2. 位置调换
当 `operation` 和第一个 `pattern` 不同时为 URL 或域名格式时，可以调换位置。

**语法**：
```txt
operation pattern1 pattern2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**示例**：
```txt
# 标准写法
www.example.com proxy://127.0.0.1:8080

# 位置调换写法
proxy://127.0.0.1:8080 www.example.com api.example.com
```

> **限制条件**：`operation` 和第一个 `pattern` 不能同时为以下格式：
> - `https://test.com/path`
> - `//test.com/path`
> - `test.com/path`
> - `test.com`

**适用场景**：
- 为多个域名应用相同操作时更简洁
- 批量配置代理、重定向等规则

### 3. 换行配置
使用代码块实现多行配置，提高复杂规则的可读性。

**语法**：
````txt
line`
operation
pattern1
pattern2
...
[includeFilter://pattern1
...
excludeFilter://patternN 
...]
`
````

**示例**：
````txt
line`
proxy://127.0.0.1:8080
www.example.com
api.example.com
static.example.com
includeFilter://m:GET
excludeFilter:///admin/
`
````

**特性**：
- Whistle 会自动将代码块内的换行符替换为空格
- 保持代码格式整洁，便于阅读和维护
- 适合包含多个匹配模式和复杂过滤条件的场景

**等价转换**：
上述换行配置等价于：
```txt
proxy://127.0.0.1:8080 www.example.com api.example.com static.example.com includeFilter://m:GET excludeFilter:///admin/
```

## 注意事项

### 1. 规则优先级
- 规则按从上到下的顺序执行
- 后面规则可能覆盖前面规则的效果
- 使用 `lineProps://important` 提升重要规则优先级

### 2. 调试技巧
1. **逐步验证**：从简单规则开始，逐步添加复杂条件
2. **日志查看**：使用 Whistle Network 界面的 Overview 面板查看规则匹配情况
3. **浏览器调试**：配合浏览器开发者工具检查实际效果
4. **临时禁用**：使用 `#` 注释暂时禁用规则进行测试
