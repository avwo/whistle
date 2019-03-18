
# req
为尽可能缩减协议，减少复杂度，该协议已在最新版本的 whistle (`>=v1.12.3`) 中删除，请及时[更新whistle](../update.html)，并用如下方式代替：

#### 修改请求URL
1. 修改请求参数：[urlParams](./urlPrams.html)、[reqMerge](./reqMerge.html)(这个协议主要用替换表单数据，如果 `GET` 等没有请求 `body` 请求则会修改请求参数，否则修改请求 `body`)
2. 正则或关键字路径替换：[pathReplace](./pathReplace.html)
3. 替换整个url：[请求替换](./rule/replace.html)

#### 修改请求方法
参见协议：[method](./method.html)

#### 修改请求头
修改任意请求头的协议：[reqHeaders](./reqHeaders.html)
对一些需要特殊处理或可能修改比较多的请求头提供了简便的配置方式：
1. 设置鉴权头：[auth](./auth.html)
2. 修改referer：[修改referer：](./修改referer：.html)
3. 修改请求`User-Agent`：[ua](./ua.html)
4. 修改请求cookie：[reqCookies](./reqCookies.html)
5. 修改请求类型：[reqType](./reqType.html)
6. 修改请求编码：[reqCharset](./reqCharset.html)
7. 修改请求的cors：[reqCors](./reqCors.html)
8. 设置 `x-forwarded-for`：[forwardedFor](./forwardedFor.html)

#### 修改请求内容
whistle可以修改任意请求内容，同时也对一些特殊的请求类型提供了简便的配置方式：
1. 请求类型为json或表单、上传表单：[reqMerge](./reqMerge.html)(如果是`GET`请求，则修改请求参数)
2. 请求类型为文本：[reqReplace](./reqReplace.html)
3. 替换请求内容：[reqBody](./reqBody.html)
4. 在请求内容前面注入内容：[reqPrepend](./reqPrepend.html)
5. 在请求内容后面注入内容：[resAppend](resAppend.html)

#### 延迟请求
参见协议：[reqDelay](./reqDelay.html)

#### 限制请求速度
参见协议：[reqSpeed](./reqSpeed.html)

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
