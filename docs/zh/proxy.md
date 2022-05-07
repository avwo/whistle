# 设置代理
Whistle v2.9.14 版本开始支持通过命令行 `w2 proxy ...` 设置系统的全局代理（目前支持支持 Windows 和 Mac 平台）

# 用法

- `w2 proxy`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`
- `w2 proxy -x "<local>, domain1, domain2"`: 设置全局代理 `127.0.0.1:port`，port 为运行的默认实例的端口（`storage` 为空），如果没有默认实例则为 `8899`，**并设置不代理域名白名单**
- `w2 proxy 8899`: 设置指定端口的代理，host 默认为 `127.0.0.1`
- `w2 proxy www.test.com:8080` 或 `w2 proxy www.test.com:auto`: 指定代理的 host 和 port
- `w2 proxy www.test.com:8080 -x "<local>, domain1, domain2"`: 组合应用
- `w2 proxy off`: 关闭全局代理

**一般执行 `w2 proxy` 即可，Mac 平台上可能要输出开机密码**

如果大家知道其它平台的设置方法可以提 PR 完善功能：https://github.com/avwo/whistle/tree/master/bin/proxy
