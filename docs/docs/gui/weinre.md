# Weinre 远程调试功能

Weinre（Web Inspector Remote）是 Whistle 集成的网页远程调试工具，允许开发者在电脑上直接调试移动设备上的网页。

<img src="/img/weinre.png" alt="Weinre 菜单" width="1000" />

## 使用方法
1. 配置调试规则，在 Whistle 规则配置中添加：
   ``` txt
    pattern weinre://your-debug-id
   ```
2. 访问目标页面
   - 在移动设备上打开/刷新需要调试的网页
   - 确保设备与调试电脑在同一网络环境
3. 在 Whistle 顶部菜单栏找到 Weinre 选项
   - 鼠标悬停后选择你设置的 your-debug-id 子菜单
   - 点击即可打开 Weinre 调试页面
4. 可以为不同页面设置独立的debug-id，实现并行调试：
    ``` txt
    mobile.example.com weinre://mobile-debug
    tablet.example.com weinre://tablet-debug
    ```

<img src="../../img/weinre-menu.png" width="300" />

