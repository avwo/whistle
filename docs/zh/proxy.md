# 代理与证书
Whistle v2.9.14 版本开始支持通过命令行 `w2 proxy ...` 设置系统的全局代理，以及 `w2 ca ...`（目前支持支持 Windows 和 Mac 平台）

# 用法

设置系统全局代理（`w2 proxy`）：

1. `w2 proxy`：设置系统代理 `127.0.0.1:port`，`port` 为当前系统运行的 Whistle 端口（如果没有取默认值 `8899`）
2. `w2 proxy 8080`：设置系统代理 `127.0.0.1:8080`
3. `w2 proxy xxx.yyy.com:8080`：设置系统代理 `xxx.yyy.com:8080`（可以指向远程 Whistle、Nohost 等代理）
4. `w2 proxy xxx.yyy.com:8080 -x "www.test.com, www.abc.com, *.xxx.com"`：设置系统代理 `xxx.yyy.com:8080`，并设置不代理请求域名（`www.test.com, www.abc.com, *.xxx.com`）
5. `w2 proxy --off`：关闭系统代理

安装系统根证书（`w2 ca`）：

1. `w2 ca`：安装本地运行的 Whistle 实例根证书（自动检测当前运行的默认实例，如果没有取默认取 `8899` 端口）
2. `w2 ca 8888`：安装本地 `8888` 端口的 Whistle 根证书
3. `w2 ca xxx.yyy.com:8080`：安装运行在 `host` 和 `port` 的其它 Whistle 或 Nohost 的根证书
4. `w2 ca filepath`：安装本地文件 `filepath` 存储的根证书
5. `w2 ca url`：安装指定 url 存储的根证书

**一般执行 `w2 proxy` 或 `w2 ca` 即可，Mac 平台上可能要输入开机密码或指纹**

如果其它平台可以协助提 PR 完善功能：https://github.com/avwo/whistle/tree/master/bin
