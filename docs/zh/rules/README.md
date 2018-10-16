# 协议列表
为了尽可能满足web开发中方方面面的需要，whistle提供基本上覆盖抓包调试工具可以做的所有事情的对应协议，可以大家会对规则匹配优先级、同时匹配的个数及每个协议的功能都会有一些疑问，下面先了解下匹配的优先级及同时可以匹配的个数，后面再对协议按功能划分，这样方便大家按需选择需要用到的协议。

### 规则匹配原则
whistle的规则匹配原则大致可以分成以下四点：

1. 相同协议规则的默认优先级从上到下，即前面的规则优先级匹配高于后面，如：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com/xxx 127.0.0.1:8080
    ```
    请求 `https://www.test.com/xxx/index.html` 按从上到下的匹配顺序，只会匹配 `www.test.com 127.0.0.1:9999`，这个与传统的hosts配置后面优先的顺序相反。
    
    > 如果想跟系统hosts匹配顺序一致，可以在界面通过 `Rules -> Settings -> Back rules first` 修改，但这个规则只对在页面里面配置的规则生效，对[插件](../plugins.html)里面自带的规则及通过[@](./@.html)方式内联的远程规则不生效。
2. 除[rule](./rule.html)及[proxy](./proxy.html)对应规则除外，可以同时匹配不同协议的规则
    ```
    www.test.com 127.0.0.1:9999
    www.test.com/xxx 127.0.0.1:8080
    www.test.com proxy://127.0.0.1:8888
    www.test.com/xxx socks://127.0.0.1:1080
    www.test.com pac://http://www.pac-server.com/test.pac
    www.test.com/xxx http://www.abc.com
    www.test.com file:///User/xxx/test
    ```
    请求 `https://www.test.com/xxx/index.html` 按从上到下的匹配顺序，及第二点原则，会匹配以下规则：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com proxy://127.0.0.1:8888
    www.test.com pac://http://www.pac-server.com/test.pac
    www.test.com/xxx http://www.abc.com
    ```
    > [proxy](./proxy.html)、[http-proxy](./socks.html)、[https-proxy](./socks.html)、[socks](./socks.html)都属于[proxy](./proxy.html)，[html](./rule/replace.html)、[file](./rule/file.html)等都属于[rule](./rule.html)，所以这两个对应的协议只能各种匹配其中优先级最高的一个。
3. 一些属于不同协议，但功能有冲突的规则，如 [rule](rule.html)、[host](host.html)、[proxy](proxy.html)，按常用优先级为 `rule > host > proxy`，如：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com/xxx 127.0.0.1:8080
    www.test.com proxy://127.0.0.1:8888
    www.test.com/xxx socks://127.0.0.1:1080
    www.test.com file:///User/xxx/test
    www.test.com/xxx http://www.abc.com
    ```
    上述同时匹配[file](file.html)、[host](host.html)、[proxy](proxy.html)，但只会执行本地替换[file](file.html)。
4. 部分相同协议会匹配及合并所有可以匹配的规则，如：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com/xxx 127.0.0.1:8080
    www.test.com proxy://127.0.0.1:8888
    www.test.com/xxx socks://127.0.0.1:1080
    www.test.com pac://http://www.pac-server.com/test.pac
    www.test.com/xxx http://www.abc.com
    www.test.com file:///User/xxx/test
    www.test.com/xxx reqHeaders://{test.json}
    www.test.com reqHeaders:///User/xxx/test.json
    www.test.com/xxx htmlAppend:///User/xxx/test.html
    www.test.com htmlAppend://{test.html}
    www.test.com/xxx reqHeaders:///User/xxx/test2.json
    www.test.com htmlAppend://{test2.html}
    ```
    请求 `https://www.test.com/xxx/index.html` 会匹配以下规则：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com proxy://127.0.0.1:8888
    www.test.com pac://http://www.pac-server.com/test.pac
    www.test.com/xxx http://www.abc.com
    www.test.com/xxx reqHeaders://{test.json}
    www.test.com reqHeaders:///User/xxx/test.json
    www.test.com/xxx htmlAppend:///User/xxx/test.html
    www.test.com htmlAppend://{test.html}
    www.test.com/xxx reqHeaders:///User/xxx/test2.json
    www.test.com htmlAppend://{test2.html}
    ```
    其中，所有匹配的[reqHeaders](./reqHeaders.html)协议的规则会将其对应的json合并后再合并到请求headers里，而所有匹配[htmlAppend](./htmlAppend.html)的html内容会通过换行符 `\n` 合并并追加到响应的html内容里面，其它可以合并的协议如下（主要涉及json、注入内容、属性设置对应的协议）：
    - [ignore](./ignore.html)
    - [enable](./enable.html)
    - [filter](./filter.html)
    - [disable](./disable.html)
    - [plugin](./plugin.html)
    - [delete](./delete.html)
    - [urlParams](./urlParams.html)
    - [params](./params.html)
    - [reqHeaders](./reqHeaders.html)
    - [resHeaders](./resHeaders.html)
    - [reqCors](./reqCors.html)
    - [resCors](./resCors.html)
    - [reqCookies](./reqCookies.html)
    - [resCookies](./resCookies.html)
    - [reqReplace](./reqReplace.html)
    - [urlReplace](./urlReplace.html)
    - [resReplace](./resReplace.html)
    - [resMerge](./resMerge.html)
    - [reqBody](./reqBody.html)
    - [reqPrepend](./reqPrepend.html)
    - [resPrepend](./resPrepend.html)
    - [reqAppend](./reqAppend.html)
    - [resAppend](./resAppend.html)
    - [resBody](./resBody.html)
    - [htmlAppend](./htmlAppend.html)
    - [jsAppend](./jsAppend.html)
    - [cssAppend](./cssAppend.html)
    - [htmlBody](./htmlBody.html)
    - [jsBody](./jsBody.html)
    - [cssBody](./cssBody.html)
    - [htmlPrepend](./htmlPrepend.html)
    - [jsPrepend](./jsPrepend.html)
    - [cssPrepend](./cssPrepend.html)

### 协议功能分类

#### @ 功能
1. [**@** (用于功能扩展及引入远程规则)](@.html)

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
1. . [**method** (修改请求方法)](method.html)

#### 修改请求头
1. . [**referer** (修改请求referer)](referer.html)
2. [**auth** (修改请求用户名密码)](auth.html)
3. [**ua** (修改请求user-agent)](ua.html)
4. [**forwardedFor** (修改请求头x-forwarded-for)](forwardedFor.html)
5. [**reqHeaders** (修改请求头)](reqHeaders.html)
6. [**reqType** (修改请求类型)](reqType.html)
7. [**reqCharset** (修改请求的编码)](reqCharset.html)
8. [**reqCookies** (修改请求cookies)](reqCookies.html)
9. [**reqCors** (修改请求cors)](reqCors.html)

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
1. [**statusCode** (直接响应)](statusCode.html)
2. [**replaceStatus** (替换后台的响应状态码)](replaceStatus.html)

#### 修改响应头
1. [**resHeaders** (修改响应头)](resHeaders.html)
2. [**resType** (修改响应类型)](resType.html)
3. [**resCharset** (修改响应的编码)](resCharset.html)
4. [**resCookies** (修改响应cookies)](resCookies.html)
5. [**resCors** (修改响应cors)](resCors.html)
6. [**attachment** (设置下载头部)](attachment.html)
7. [**redirect** (302重定向)](redirect.html)

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

#### 过滤配置
1. [**filter** (过滤规则，隐藏请求等)](filter.html)
2. [**ignore** (忽略规则)](ignore.html)

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
1. [**reqScript** (批量设置请求规则或通过脚本动态获取规则)](reqScript.md)
2. [**resScript** (批量设置响应规则或通过脚本动态获取规则)](resScript.md)

#### 开发调试工具
1. [**plugin** (通过插件获取请求状态及设置新规则)](plugin.html)
3. [**weinre** (设置weinre，调试手机页面)](weinre.html)
4. [**log** (打印网页js错误或者调试信息)](log.html)
