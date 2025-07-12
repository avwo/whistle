# Console 界面

Console 界面是 [log 规则](../rules/log) 的可视化展示平台，专门用于监控和分析：
- 页面 JavaScript 错误
- `console.log`、`console.warn` 等控制台输出

<img src="/img/console.png" alt="Console 界面" width="360" />

| 能区                 | 功能说明                                                     |
| -------------------- | ------------------------------------------------------------ |
| **All logs**         | 显示所有日志分类（对应 `log://id` 中的 id），点击分类快速过滤特定页面的日志 |
| **All levels**       | 按日志级别过滤（Debug/Log/Info/Warn/Error/Fatal）            |
| **Expand JSON Root** | 自动展开 JSON 数据的首层结构                                 |
| **ecord**            | 开始/停止/暂停日志记录                                       |
| **Import**           | 导入历史日志文件（.json/.txt）                               |
| **Export**           | 导出当前日志                       |
| **Clear**            | 清空当前日志                                               |

