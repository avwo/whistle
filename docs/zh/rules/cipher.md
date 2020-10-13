# cipher
> 版本要求：`v2.5.24+`

自定义https的兜底加密算法，某些服务会出现tls版本和加密算法不匹配导致Node无法正常请求，这种情况下whistle会自动采用用户自定义的兜底加密算法：

	pattern cipher://cipherName

默认为 `ECDHE-ECDSA-AES256-GCM-SHA384`，可以选算法有：`NULL-SHA256`, `AES128-SHA256`, `AES256-SHA256`, `AES128-GCM-SHA256`, `AES256-GCM-SHA384`, `DH-RSA-AES128-SHA256`, `DH-RSA-AES256-SHA256`, `DH-RSA-AES128-GCM-SHA256`, `DH-RSA-AES256-GCM-SHA384`, `DH-DSS-AES128-SHA256`, `DH-DSS-AES256-SHA256`, `DH-DSS-AES128-GCM-SHA256`, `DH-DSS-AES256-GCM-SHA384`, `DHE-RSA-AES128-SHA256`, `DHE-RSA-AES256-SHA256`, `DHE-RSA-AES128-GCM-SHA256`, `DHE-RSA-AES256-GCM-SHA384`, `DHE-DSS-AES128-SHA256`, `DHE-DSS-AES256-SHA256`, `DHE-DSS-AES128-GCM-SHA256`, `DHE-DSS-AES256-GCM-SHA384`, `ECDHE-RSA-AES128-SHA256`, `ECDHE-RSA-AES256-SHA384`, `ECDHE-RSA-AES128-GCM-SHA256`, `ECDHE-RSA-AES256-GCM-SHA384`, `ECDHE-ECDSA-AES128-SHA256`, `ECDHE-ECDSA-AES256-SHA384`, `ECDHE-ECDSA-AES128-GCM-SHA256`, `ECDHE-ECDSA-AES256-GCM-SHA384`, `ADH-AES128-SHA256`, `ADH-AES256-SHA256`, `ADH-AES128-GCM-SHA256`, `ADH-AES256-GCM-SHA384`, `AES128-CCM`, `AES256-CCM`, `DHE-RSA-AES128-CCM`, `DHE-RSA-AES256-CCM`, `AES128-CCM8`, `AES256-CCM8`, `DHE-RSA-AES128-CCM8`, `DHE-RSA-AES256-CCM8`, `ECDHE-ECDSA-AES128-CCM`, `ECDHE-ECDSA-AES256-CCM`, `ECDHE-ECDSA-AES128-CCM8`, `ECDHE-ECDSA-AES256-CCM8`；pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.test.com cipher://DH-RSA-AES256-GCM-SHA384

#### 如何选择算法，不经过whistle访问，通过浏览器查看以下信息：
``` txt
签名算法：sha256RSA
```

通过签名算法找到对应的加密算法（如上加密算法关键字为 `RSA`）。

#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](./ignore.html)：忽略指定规则
2. [filter](./filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

例子：

```
# 下面表示匹配pattern的同时不能为post请求且请求头里面的cookie字段必须包含test(忽略大小写)、url里面必须包含 cgi-bin 的请求
# 即：过滤掉匹配filter里面的请求
pattern operator1 operator2 excludeFilter://m:post includeFilter://h:cookie=test includeFilter:///cgi-bin/i

# 下面表示匹配pattern1、pattern2的请求方法为post、或请求头里面的cookie字段不能包含类似 `uin=123123` 且url里面必须包含 cgi-bin 的请求
operator pattern1 pattern2 includeFilter://m:post excludeFilter://h:cookie=/uin=o\d+/i excludeFilter:///cgi-bin/i

# 下面表示匹配pattern的请求忽略除了host以外的所有规则
pattern ignore://*|!host

# 下面表示匹配pattern的请求忽略file和host协议的规则
pattern ignore://file|host
```
