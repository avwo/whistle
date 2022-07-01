# w2 proxy
设置系统全局代理命令，目前只支持 Mac 和 Windows 系统。

## 用法
1. 设置本机默认 Whistle 实例的代理：
    ``` sh
    w2 proxy
    ```
    > 设置系统代理 `127.0.0.1:PORT`，`PORT` 为当前系统运行的 Whistle 端口（如果没有取默认值 `8899`）
2. 指定端口：
    ``` sh
    w2 proxy 8888
    ```
    > 设置系统代理 `127.0.0.1:8888`
3. 指定域名（或IP）及端口：
    ``` sh
    w2 proxy xxx.domain.com:8888
    ```
    > 设置系统代理 `xxx.domain.com:8888`，`xxx.domain.com` 可为域名或 IP
4. 指定不代理域名1：
    ``` sh
    w2 proxy -x "www.test.com, www.abc.com, *.xxx.com"
    ```
    > 设置默认代理，并设置不代理请求域名（`www.test.com, www.abc.com, *.xxx.com`）
5. 指定不代理域名2：
    ``` sh
    w2 proxy xxx.domain.com:8888 -x "www.test.com, www.abc.com, *.xxx.com"
    ```
    > 设置系统代理 `xxx.domain.com:8888`，`xxx.domain.com` 可为域名或 IP，并设置不代理请求域名（`www.test.com, www.abc.com, *.xxx.com`）
6. 关闭代理：
    ``` sh
    w2 proxy off
    ```

注意，Mac 系统需要输入开机密码：

<img alt="输入开机密码" width="300" src="https://user-images.githubusercontent.com/11450939/176977027-4a7b06a0-64f6-4580-b983-312515e9cd4e.png">

如果上述命令系统不支持或安装失败，也可以：[手动安装](../manual/)
