# res
为尽可能缩减协议，减少复杂度，该协议已在最新版本的 whistle (`>=v1.12.3`) 中删除，请及时[更新whistle](../update.html)，并用如下方式代替：

#### 修改响应状态码
1. 直接响应设置的状态码（请求不会到后台）：[statusCode](./statusCode.html)
2. 修改后台返回的状态码：[replaceStatus](./replaceStatus.html)

#### 修改响应头
修改任意响应头的协议：[reqHeaders](./resHeaders.html)
对一些需要特殊处理或可能修改比较多的响应头提供了简便的配置方式：
1. 设置缓存头：[cache](./cache.html)
2. 302重定向：[redirect](./redirect.html)
3. 浏览器重定向：[locationHref](./locationHref.html)
4. 设置下载：[attachment](./attachment.html)
5. 修改响应cookie：[resCookies](./resCookies.html)
6. 修改响应编码：[resCharset](./resCharset.html)
7. 修改响应头的类型：[resType](./resType.html)
8. 设置响应头的cors：[resCors](./resCors.html)

#### 修改响应内容
whistle可以修改任意响应内容，同时也对一些特殊的响应类型提供了简便的配置方式：
1. 本地替换：[file](./rule/file.html)
2. 响应类型为`json`或`html`、`js`，且内容为json或jsonp对象：[resMerge](./resMerge.html)
2. 响应类型为文本：[resReplace](./resReplace.html)
3. 替换html类型的内容：[htmlBody](./htmlBody.html)
4. 在html类型的内容前面注入html：[htmlPrepend](./htmlPrepend.html)
5. 在html类型的内容后面注入html：[htmlAppend](./htmlAppend.html)
6. 替换css类型的内容：[cssBody](./cssBody.html)
7. 在css类型的内容前面注入css：[cssPrepend](./cssPrepend.html)
8. 在css类型的内容后面注入css：[cssAppend](./cssAppend.html)
9. 替换js类型的内容：[jsBody](./jsBody.html)
10. 在js类型的内容前面注入js：[jsPrepend](./jsPrepend.html)
11. 在js类型的内容后面注入js：[jsAppend](./jsAppend.html)
12. 替换响应内容：[reqBody](./reqBody.html)
13. 在响应内容前面注入内容：[reqPrepend](./reqPrepend.html)
14. 在响应内容后面注入内容：[resAppend](resAppend.html)


#### 延迟响应
参见协议：[resDelay](./resDelay.html)

#### 限制响应速度
参见协议：[resSpeed](./resSpeed.html)
