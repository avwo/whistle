# Network 界面

查看、管理抓包数据的界面

<img src="/img/network.png" alt="Network 界面" width="1000" />


## 底部搜索框{#filter}

搜索框支持多种高级过滤方式，可通过前缀快速定位特定类型的请求：

| 前缀            | 过滤目标                            | 示例                              |
| --------------- | ----------------------------------- | --------------------------------- |
| `无前缀`        | 请求 URL                            | `example.com/api` `/abc=123/i`    |
| `m:pattern`     | 请求方法                            | `m:pos` `m:/get\|post/i`  |
| `h:pattern`     | 请求 / 响应头原始文本               | `h:image/` `h:/cookie:\s*test=123/i` |
| `H:pattern`     | 请求头 Host 字段                    | `H:example.com` `H:/test/i`       |
| `b:pattern`     | 请求 / 响应体原始内容               | `b:"error":true` `b:/\d{3}/`     |
| `i:pattern`     | 客户端 IP 或服务的 IP               | `i:11.2`  `i:/^11\.2/`         |
| `s:pattern`     | 响应状态码                          | `s:404`  `s:/5\d{2}/`             |
| `t:pattern`     | 响应头 Content-Type 内容              | `t:json` `t:/html\|xml/i` |
| `mark:pattern`  | 右键菜单手动 Mark 的请求 URL        | `mark:example.com` `mark:/\d{5}/` |
| `app:pattern`   | 按 APP 名称过滤                     | `app:wechat` `app:chrome`         |
| `fc:pattern`    | Composer发出的请求 URL              | `fc:/test/` `fc:www.test.com`     |
| `e:pattern`     | 出错的请求 URL                      | `e:timeout`   `e:/abort/i`                  |
| `style:pattern` | [style](/docs/rules/style) 操作内容 | `style:italic` `style:/ita/i`       |

`pattern` 为**关键字**或**正则表达式**，多条件 "与" 搜索：
``` txt
b:/"success":false/ m:POST s:200 H:api.example.com
```

## Settings
**Exclude Filter**（排除过滤器） 和 **Include Filte**（包含过滤器） 允许对未在 Network 显示过的抓包数据进行精细化筛选，支持多条件组合过滤：

| **过滤类型**       | **作用**                                 |      |
| ------------------ | ---------------------------------------- | ---- |
| **Include Filter** | **只保留**满足条件的请求（相当于白名单） |      |
| **Exclude Filter** | **排除**满足条件的请求（相当于黑名单）   |      |

1. 单个输入框内的条件
   - 分隔方式：用 空格 或 换行符 分隔多个条件
   - 逻辑关系：条件间是 "或"（OR） 关系
    > 示例：`example.com api.test.com` → 匹配 example.com 或 api.test.com 的请求
2. 多个输入框之间的条件
   - 逻辑关系：不同输入框之间是 "与"（AND） 关系
   - 示例：
      - Include Filter 输入：`m:GET`
      - Exclude Filter 输入：`h:/cookie:[^\r\n]*test=123/`
      - 最终效果：只保留 GET 请求，且排除请求头 cookie 里面包含 `test=123`的请求

**支持的过滤条件**：

| **语法**    | **作用**                        | **示例**                                     |
| ----------- | ------------------------------- | -------------------------------------------- |
| `无前缀`    | 匹配请求 URL 包含该关键字的请求 | `.example.com`                               |
| `m:pattern` | 匹配请求方法                    | `m:POST`（匹配 POST 请求）                   |
| `h:pattern` | 匹配原始请求头                  | `h:/cookie:[^\r\n]*test=123/`（匹配 cookie） |
| `H:pattern` | 匹配请求头 Host 字段            | `H:example.com` `H:/test/i`                  |
| `i:pattern` | 匹配客户端 IP                   | `i:11.2`  `i:/^11\.2/`                       |

与 Network 列表底部搜索框不同：

| **功能**         | **Network 底部搜索框**     | **Settings 中的 Filter**             |
| ---------------- | -------------------------- | ------------------------------------ |
| **匹配范围**     | 请求 + 响应阶段的所有数据  | **仅匹配请求阶段**（不包含响应数据） |
| **生效时机**     | 实时过滤已显示和未来的请求 | **仅对未来新请求生效**               |
| **历史数据影响** | 可过滤已存在的抓包记录     | **不影响已显示的请求**               |

**其它选项：**

| 项名称                                    | 功能说明                                                 |
| ----------------------------------------- | -------------------------------------------------------- |
| **Network Columns**                       | 自定义抓包列表显示的列（如状态码、方法、大小等）         |
| **Maximum Rows**                          | 设置同时显示的最大抓包数量（防止内存溢出）               |
| **Viewing only your computer's requests** | 只显示本机发出的请求（过滤其他设备/远程请求）            |
| **ViewAll in new window**                 | 点击"View All"时在新窗口打开完整内容（适合大响应体查看） |
| **Show Tree View**                        | 以树状结构展示请求（按域名/路径分组）                    |

## 详情面板{#detail}

1. Overview：匹配的规则及请求的一些基本信息
2. Inspectors：请求/响应头及内容的详细信息
3. Timeline：请求的性能信息
4. Composer：[Componser 界面](./https)
5. Tools：一些工具
   - Console：显示远程界面 console 日志的平台，详见：[Console](./console)
   - Server：Whistle 运行过程发生的一些异常
   - Toolbox：一些常用的工具方法

## 其它菜单
1. Replay：重新请求选中的抓包数据
2. Edit：将抓包数据填充到右侧的 Composer
3. 右上角箭头按钮：切换到上下面板的模式，适合竖屏显示器
