# Composer 界面

Composer 是 Whistle 提供的 HTTP 请求构造工具，可用于快速创建、修改和发送自定义请求，支持高级调试功能。

<img src="/img/composer.png" alt="Composer 界面" width="360" />

| 组件                     | 功能 |
| ------------------------ | ---- |
| **历史记录按钮**         | 显示或隐藏历史记录 |
| **选择方法**       |   选择请求方法，支持 GET/POST/PUT 等多种种方法   |
| **URL 输入框**           | 编辑或输入请求 URL径 |
| **Params**               | 添加、修改、删除请求参数 |
| **发送按钮**             | 执行当前请求 |
| **Rules + Whistle 选项** | Rules：是否启用输入框里面的规则，Whistle：否启用 Whistle 里面配置的规则|
| **Pretty** |   格式化显示内容   |
| **Body** |   是否包含请求体（GET/HEAD/OPTIONS 等方法会自动忽略请求体）   |
| **HTTP/2** | 是否使用 HTTP/2 协议 |
| **Import**  | 导入请求数据 |
| **Export**  | 导出请求数据 |
| **CopyAsCURL** | 生成可执行的 cURL 命令 |
| **规则输入框** |   自定义规则，只对当前构造的请求生效   |
| **请求头** |   自定义请求头   |
| **请求内容** |  自定义请求内容    |

