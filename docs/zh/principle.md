# 匹配原则
whistle的协议比较多，具体参见：[协议列表](./rules)，这些协议的匹配优先级及同时可匹配规则个数遵循以下四个原则：

1. 相同协议规则的默认优先级从上到下，即前面的规则优先级匹配高于后面，如：
    ```
    www.test.com 127.0.0.1:9999
    www.test.com/xxx 127.0.0.1:8080
    ```
    请求 `https://www.test.com/xxx/index.html` 按从上到下的匹配顺序，只会匹配 `www.test.com 127.0.0.1:9999`，这个与传统的hosts配置后面优先的顺序相反。

    > 如果想跟系统hosts匹配顺序一致，可以在界面通过 `Rules -> Settings -> Back rules first` 修改，但这个规则只对在页面里面配置的规则生效，对[插件](./plugins.html)里面自带的规则及通过[@](./rules/@.html)方式内联的远程规则不生效。
2. 除[rule](./rules/rule/)及[proxy](./rules/proxy.html)对应规则除外，可以同时匹配不同协议的规则
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
    > [proxy](./rules/proxy.html)、[http-proxy](./rules/proxy.html)、[https-proxy](./rules/https-proxy.html)、[socks](./rules/socks.html)都属于[proxy](./rules/proxy.html)，[html](./rules/rule/replace.html)、[file](./rules/rule/file.html)等都属于[rule](./rules/rule/)，所以这两个对应的协议只能各种匹配其中优先级最高的一个。
3. 一些属于不同协议，但功能有冲突的规则，如 [rule](rule/)、[host](host.html)、[proxy](proxy.html)，按常用优先级为 `rule > host > proxy`，如：
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
    其中，所有匹配的[reqHeaders](./rules/reqHeaders.html)协议的规则会将其对应的json合并后再合并到请求headers里，而所有匹配[htmlAppend](./rules/htmlAppend.html)的html内容会通过换行符 `\n` 合并并追加到响应的html内容里面，其它可以合并的协议如下（主要涉及json、注入内容、属性设置对应的协议）：
    - [ignore](./rules/ignore.html)
    - [enable](./rules/enable.html)
    - [filter](./rules/filter.html)
    - [disable](./rules/disable.html)
    - [plugin](./rules/plugin.html)
    - [delete](./rules/delete.html)
    - [urlParams](./rules/urlParams.html)
    - [params](./rules/params.html)
    - [reqHeaders](./rules/reqHeaders.html)
    - [resHeaders](./rules/resHeaders.html)
    - [reqCors](./rules/reqCors.html)
    - [resCors](./rules/resCors.html)
    - [reqCookies](./rules/reqCookies.html)
    - [resCookies](./rules/resCookies.html)
    - [reqReplace](./rules/reqReplace.html)
    - [urlReplace](./rules/urlReplace.html)
    - [resReplace](./rules/resReplace.html)
    - [resMerge](./rules/resMerge.html)
    - [reqBody](./rules/reqBody.html)
    - [reqPrepend](./rules/reqPrepend.html)
    - [resPrepend](./rules/resPrepend.html)
    - [reqAppend](./rules/reqAppend.html)
    - [resAppend](./rules/resAppend.html)
    - [resBody](./rules/resBody.html)
    - [htmlAppend](./rules/htmlAppend.html)
    - [jsAppend](./rules/jsAppend.html)
    - [cssAppend](./rules/cssAppend.html)
    - [htmlBody](./rules/htmlBody.html)
    - [jsBody](./rules/jsBody.html)
    - [cssBody](./rules/cssBody.html)
    - [htmlPrepend](./rules/htmlPrepend.html)
    - [jsPrepend](./rules/jsPrepend.html)
    - [cssPrepend](./rules/cssPrepend.html)
