# Network 界面

查看、管理抓包数据的界面

<img src="/img/network.png" alt="Network 界面" width="1000" />


## 顶部菜单{#top-menus}
1. Record：是否开启、停止或暂停抓包功能
   - 红色图标：表示开启（默认开启）
   - 方形灰色图标：表示停止
   - 圆形灰色图标：表示暂停
2. Import：导入抓包数据，支持导入 HAR、SAZ 及 Whistle（`.txt`）自定义的抓包数据格式
3. Export：导出抓包数据，支持导出 HAR、SAZ 及 Whistle（`.txt`）自定义的抓包数据格式
4. Clear：清空当前会话的抓包列表
5. Replay：重新发送选中的请求（支持多选）
6. Edit：将选中请求填充到 Composer（编辑面板）
7. Settings：Network 设置对话框
   - Exclude Filter：排除抓包数据
   - Include Filter：
   - Network Columns：
   - Maximum Rows：
   - Viewing only your computer's network requests：
   - ViewAll in new window：
   - Show Tree View：抓包列表以树状显示
8. Weinre：[Weinre 菜单](/docs/gui/https)
9. HTTPS：[HTTPS 对话框](/docs/gui/https)

## 右键菜单{#context-menus}

1. Open：
   - New Tab：在新页面打开当前请求 URL
   - QR Code：显示当前请求 URL 的二维码
   - Overview：打开请求的 Overview 面板
   - Inspectors：打开请求的 Inspectors 面板
   - Timeline：打开请求的 Timeline 面板
   - Composer：打开请求的 Overview 面板
   - Preview：预览当前响应内容
   - Source：打开当前请求的原始抓包数据
   - Tree View / List View：以树状 / 列表的方式显示抓包数据
2. Copy：
   - Cell Text：复制当前右键点击的单元格文本内容
   - Host：复制当前右键点击的抓包请求 Host 列内容
   - Path：复制当前右键点击的抓包请求的域名 Host 列内容
   - URL：
   - Full URL：
   - As CURL：
   - Client IP：
   - Server IP：
   - Cookie：
3. Remove：
   - All：
   - One：
   - Others：
   - Selected：
   - Unselected：
   - Unmarked：
   - All Matching Hosts：
   - All Matching URLs：
4. Settings：
   - Edit Settings：
   - Exclude All Matching Hosts：
   - Exclude All Matching URLs：
5. Actions：
   - Abort：
   - Replay：
   - Replay Times：
   - Edit Request：
   - Mark：
   - Unmark：
6. Tree：
   - Expand：
   - Collapse：
   - Expand All：
   - Collapse All：
7. Mock
8. Import：
9. Export：
10. Others：

## 底部过滤搜索框{#filter-input}

搜索框支持以下搜索方式：
1. `xxx`：默认根据请求 URL 进行过滤
2. `m:xxx`：
3. ：
4. ：
5. ：
6. ：
7. ：

## 详情面板{#detail}
1. Overview：
2. Inspectors：
3. Timeline：
4. Composer：[Componser 界面](/docs/gui/https)
5. Tools：
