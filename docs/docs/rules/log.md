# log 规则

自动在页面中注入 JavaScript 代码，捕获 JavaScript 异常及 `console.xxx` 日志，并在 Whistle 管理界面中实时显示。

## 功能概述
- **异常监控**：自动捕获页面中的 JavaScript 执行错误和未处理的 Promise 异常。
- **日志收集**：拦截并收集所有 `console.log()`、`console.warn()`、`console.error()` 等控制台输出。
- **可视化查看**：在 Whistle 管理界面中按分组实时查看、筛选和搜索日志。
- **日志预处理**：支持通过自定义脚本对日志内容进行过滤或格式化处理。

## 规则语法
```
pattern log://id [filters...]
```

### 参数说明
| 参数     | 是否必填 | 描述                                                                 | 详细说明                                                                 |
|----------|----------|----------------------------------------------------------------------|--------------------------------------------------------------------------|
| pattern  | 是       | 匹配请求 URL 的表达式，用于指定需要监控的页面                         | [匹配模式语法](./pattern)                                                |
| id       | 是       | 日志分组标识（普通字符串），用于在 Whistle 界面中区分和筛选不同来源的日志 | 同一分组下的日志会集中显示，支持按 ID 快速切换视图                       |
| filters  | 否       | 过滤器条件，用于进一步匹配请求或响应的特定特征                         | [过滤器语法](./filters) <br> 支持按 URL、方法、请求头、响应状态码等过滤 |

## 使用方法

### 基础用法
捕获指定域名下所有页面的日志：
```
www.example.com log://myapp
```

### 多域名分组监控
为不同域名或路径设置不同的日志分组，便于分类查看：
```
ke.qq.com log://ke
news.qq.com log://news
api.example.com log://api
```

## 高级配置：日志预处理

通过 `jsPrepend` 规则注入自定义脚本，可在日志发送到 Whistle 前进行预处理，例如敏感信息脱敏、格式转换或条件过滤。

### 配置示例
```
www.example.com log:// jsPrepend://{handleLog.js}
```

### 预处理脚本示例
```javascript
// handleLog.js
// 在日志发送到 Whistle 前执行的自定义处理函数
window.onBeforeWhistleLogSend = function(result, level) {
  // result: 待输出的原始信息数组
  // level: 日志级别 ('log', 'warn', 'error', 'info', 'debug')
  
  result.forEach(function(msg, i) {
    // 示例1：隐藏敏感关键词
    if (typeof msg === 'string' && msg.includes('password')) {
      result[i] = '[SENSITIVE DATA HIDDEN]';
    }
    
    // 示例2：特定内容转换为结构化对象
    if (msg === 'abc') {
      result[i] = {
        name: 'avenwu',
        level: level,
        timestamp: new Date().toISOString()
      };
    }
    
    // 示例3：过滤掉某些类型的日志
    if (msg === 'ignore-this-message') {
      // 返回空数组将阻止此条日志发送
      result.splice(i, 1);
    }
  });
};
```

## 界面操作指南

### 查看日志
1. 打开 Whistle 管理界面（默认为 `http://127.0.0.1:8899`）
2. 切换到 **Network / Tools / Console** 标签页
3. 在左上角选择对应的日志分组 ID
4. 实时查看页面输出的日志和错误信息

### 日志筛选
- 使用顶部的筛选栏可按日志级别（Log/Warn/Error）快速过滤
- 支持关键词搜索，快速定位特定日志
