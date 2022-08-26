# 代理与证书
Whistle v2.9.14 版本开始支持通过命令行 `w2 proxy ...` 设置系统的全局代理，以及 `w2 ca ...` 安装系统根证书（目前只支持 Windows 和 Mac 平台）

> **一般执行 `w2 proxy` 或 `w2 ca` 即可，Mac 平台上可能要输入开机密码或指纹**

# w2 proxy
设置系统全局代理命令，目前只支持 Mac 和 Windows 系统：

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

# w2 ca
安装系统根证书命令，目前只支持 Mac 和 Windows 系统：

1. 安装本机默认 Whistle 实例的证书：
    ``` sh

    ```
    > 安装本地运行的 Whistle 实例根证书（自动检测当前运行的默认实例，如果没有取默认取 `8899` 端口）
2. 安装指定端口的 Whistle 实例的证书：
    ``` sh
    w2 ca 8888
    ```
    > 安装本地 `8888` 端口的 Whistle 根证书
3. 安装运行在 `host` 和 `port` 的其它 Whistle 或 Nohost 的根证书：
    ``` sh
    w2 ca xxx.yyy.com:8080
    ```
    > 可以用来安装其它代理服务的证书
4. 下载指定 URL 的根证书并安装：
    ``` sh
    w2 ca url
    ```
    > 可以用来安装其它代理服务的证书
5. 下载指定本地路径的根证书并安装：
    ``` sh
    w2 ca filepath
    ```
    > 可以用来安装其它代理服务的证书

注意，Mac 系统需要指纹验证或输入开机密码：

<img alt="输入指纹" width="300" src="https://user-images.githubusercontent.com/11450939/168847123-e66845d0-6002-4f24-874f-b6943f7f376b.png">

如果上述命令系统不支持或安装失败，也可以：[手动设置代理](./install) 或 [手动安装证书](./webui/https.md)
