# 协议列表
为了尽可能满足web开发中方方面面的需要，whistle提供基本上覆盖抓包调试工具可以做的所有事情的对应协议，按功能可以分以下类别，大家可以按需查找：

> 有关协议的优先级及匹配情况参见：[匹配原则](../principle.html)

#### @ 功能
1. [**@** (用于功能扩展及引入远程规则)](@.html)

#### 设置UI样式
1. [**style** (设置抓包列表样式)](style.html)

#### 设置hosts
1. [**host** (设置host)](host.html)

#### 设代理
1. [**proxy(http-proxy)** (代理到其它http代理服务器)](proxy.html)
2. [**https-proxy** (代理到其它https代理服务器)](https-proxy.html)
3. [**socks** (代理到其它socks代理服务器)](socks.html)
4. [**pac** (设置pac脚本)](pac.md)

#### 延迟请求
1. [**reqDelay** (延迟请求)](reqDelay.html)
2. [**reqSpeed** (限制请求速度)](reqSpeed.html)

#### 修改请求URL
1. [**urlParams** (修改请求url的参数)](urlParams.html)
2. [**reqMerge** (修改请求参数)](reqMerge.html)
3. [**pathReplace** (通过正则或字符串替换请求url，类似str.replace)](pathReplace.html)

#### 修改请求方法
1. [**method** (修改请求方法)](method.html)

#### 修改请求头
1. [**referer** (修改请求referer)](referer.html)
2. [**auth** (修改请求用户名密码)](auth.html)
3. [**ua** (修改请求user-agent)](ua.html)
4. [**forwardedFor** (修改请求头x-forwarded-for)](forwardedFor.html)
5. [**reqHeaders** (修改请求头)](reqHeaders.html)
6. [**reqType** (修改请求类型)](reqType.html)
7. [**reqCharset** (修改请求的编码)](reqCharset.html)
8. [**reqCookies** (修改请求cookies)](reqCookies.html)
9. [**reqCors** (修改请求cors)](reqCors.html)
10. [**headerReplace** (通过str.replace的方式修改请求响应头)](headerReplace.html)

#### 延迟响应
1. [**resDelay** (延迟响应)](resDelay.html)
2. [**resSpeed** (限制响应速度)](resSpeed.html)

#### 修改请求内容
> 根据不同的数据类型采用不同的协议

1. [**reqPrepend** (往请求内容前面添加数据)](reqPrepend.html)
2. [**reqBody** (替换请求内容)](reqBody.html)
3. [**reqAppend** (往请求内容后面追加数据)](reqAppend.html)
4. [**reqReplace** (通过正则或字符串替换请求文本内容，类似str.replace)](reqReplace.html)
5. [**reqMerge** (修改请求参数或请求内容)](reqMerge.html)

#### 修改响应状态码
1. [**replaceStatus** (替换后台的响应状态码)](replaceStatus.html)
2. [**statusCode** (直接响应)](rule/statusCode.html)

#### 修改响应头
1. [**resHeaders** (修改响应头)](resHeaders.html)
2. [**resType** (修改响应类型)](resType.html)
3. [**resCharset** (修改响应的编码)](resCharset.html)
4. [**resCookies** (修改响应cookies)](resCookies.html)
5. [**resCors** (修改响应cors)](resCors.html)
6. [**attachment** (设置下载头部)](attachment.html)

#### 修改响应内容
> 根据不同的数据类型采用不同的协议

1. [**rule** (设置响应规则)](rule/index.html)
    * [**请求替换**](rule/replace.html)
    * [**file** (替换本地文件)](rule/file.html)
    * [**xfile** (替换本地文件，如果本地文件找不到会继续请求线上)](rule/xfile.html)
    * [**tpl** (替换本地目标文件，可用于模拟jsonp请求)](rule/tpl.html)
    * [**xtpl** (替换本地目标文件，如果本地文件找不到会继续请求线上，可用于模拟jsonp请求)](rule/xtpl.html)
    * [**rawfile** (替换本地http响应内容格式的文件)](rule/rawfile.html)
    * [**xrawfile** (替换本地http响应内容格式的文件，如果本地文件找不到会继续请求线上)](rule/xrawfile.html)
    * [**redirect** (302 重定向))](rule/redirect.html)
    * [**statusCode** (直接响应)](rule/statusCode.html)
    * [**自定义**](rule/custom.html)
2. [**resMerge** (修改响应参数)](resMerge.html)
3. [**resPrepend** (往响应内容前面添加数据)](resPrepend.html)
4. [**resBody** (替换响应内容)](resBody.html)
5. [**resAppend** (往响应内容后面追加数据)](resAppend.html)
6. [**resReplace** (通过正则或字符串替换响应文本内容，类似str.replace)](resReplace.html)
7. [**htmlPrepend**(往响应为html的内容前面添加数据)](htmlPrepend.md)
8. [**cssPrepend** (往响应为html或css的内容前面添加数据)](cssPrepend.md)
9. [**jsPrepend** (往响应为html或js的内容前面添加数据)](jsPrepend.md)
10. [**htmlBody**(替换响应为html的内容)](htmlBody.md)
11. [**cssBody** (替换响应为html或css的内容)](cssBody.md)
12. [**jsBody** (替换响应为html或js的内容)](jsBody.md)
13. [**htmlAppend**(往响应为html的内容后面追加数据)](htmlAppend.md)
14. [**cssAppend** (往响应为html或css的内容后面追加数据)](cssAppend.md)
15. [**jsAppend** (往响应为html或js的内容后面追加数据)](jsAppend.md)

#### 修改 trailers
1. [**trailers** (302重定向)](trailers.html)

#### 过滤配置
1. [**filter (excludeFilter|includeFilter)** (过滤规则，隐藏请求等)](filter.html)
2. [**ignore (skip)** (忽略规则)](ignore.html)

#### 启用或禁用一些配置
1. [**enable** (设置capture HTTPs，隐藏请求等)](enable.html)
2. [**disable** (禁用缓存、cookie等)](disable.html)
3. [**delete** (删除指定的字段)](delete.html)

#### 获取抓包数据
1. [**reqWrite** (将请求内容写入指定的文件)](reqWrite.html)
2. [**resWrite** (将响应内容写入指定的文件)](resWrite.html)
3. [**reqWriteRaw** (将请求的完整内容写入指定的文件)](reqWriteRaw.html)
4. [**resWriteRaw** (将响应的完整内容写入指定的文件)](resWriteRaw.html)
推荐通过插件获取，具体参考：[插件开发](../plugins.html)

#### 动态设置规则
1. [**reqScript (reqRules)** (批量设置请求规则或通过脚本动态获取规则)](reqScript.md)
2. [**resScript (resRules)** (批量设置响应规则或通过脚本动态获取规则)](resScript.md)

#### 开发调试工具
1. [**plugin** (配置匹配的插件)](plugin.html)
3. [**weinre** (设置weinre，调试手机页面)](weinre.html)
4. [**log** (打印网页js错误或者调试信息)](log.html)
5. [**pipe** 把数据流转到插件](rules/pipe.html)


#### 修改加密算法
1. [**cipher** (设置兜底加密算法)](cipher.html)
