# 操作协议列表

## 特殊规则
1. [@（引入远程规则或设置客户端证书）](./@)
2. [%（设置插件的变量值）](./plugin-vars)

## Map Local（用本地文件替换响应内容）
1. [file](./file)
2. [xfile](./xfile)
3. [tpl](./tpl)
4. [xtpl](./xtpl)
5. [rawfile](./rawfile)
6. [xrawfile](./xrawfile)

## Map Remote（返回其它 URL 的数据）
1. [https](./https)
2. [http](./http)
3. [wss](./wss)
4. [ws](./ws)
5. [tunnel](./tunnel)

## DNS Spoofing（修改请求 IP 地址）
1. [host](./host)
2. [xhost](./xhost)
3. [proxy (http-proxy)](./proxy)
4. [xproxy (xhttp-proxy)](./xproxy)
5. [https-proxy](./https-proxy)
6. [xhttps-proxy](./xhttps-proxy)
7. [socks](./socks)
8.  [xsocks](./xsocks)
9.  [pac](./pac)

## Rewrite Request（修改请求数据）
1. [urlParams](./urlParams)
2. [pathReplace](./pathReplace)
3. [sniCallback](./sniCallback)
4. [method](./method)
5. [cipher](./cipher)
6. [reqHeaders](./reqHeaders)
7. [forwardedFor](./forwardedFor)
8. [ua](./ua)
9. [auth](./auth)
10. [cache](./cache)
11. [referer](./referer)
12. [attachment](./attachment)
13. [reqCharset](./reqCharset)
14. [reqCookies](./reqCookies)
15. [reqCors](./reqCors)
16. [reqType](./reqType)
17. [reqBody](./reqBody)
18. [reqMerge](./reqMerge)
19. [reqPrepend](./reqPrepend)
20. [reqAppend](./reqAppend)
21. [reqReplace](./reqReplace)
22. [reqWrite](./reqWrite)
23. [reqWriteRaw](./reqWriteRaw)
24. [reqRules](./reqRules)
25. [reqScript](./reqScript)

## Rewrite Reponse（修改响应数据）
1. [statusCode](./statusCode)
2. [replaceStatus](./replaceStatus)
3. [redirect](./redirect)
4. [locationHref](./locationHref)
5. [resHeaders](./resHeaders)
6. [responseFor](./responseFor)
7. [resCharset](./resCharset)
8. [resCookies](./resCookies)
9. [resCors](./resCors)
10. [resType](./resType)
11. [resBody](./resBody)
12. [resMerge](./resMerge)
13. [resPrepend](./resPrepend)
14. [resAppend](./resAppend)
15. [resReplace](./resReplace)
16. [htmlPrepend](./htmlPrepend)
17. [htmlBody](./htmlBody)
18. [htmlAppend](./htmlAppend)
19. [cssPrepend](./cssPrepend)
20. [cssBody](./cssBody)
21. [cssAppend](./cssAppend)
22. [jsPrepend](./jsPrepend)
23. [jsBody](./jsBody)
24. [jsAppend](./jsAppend)
25. [trailers](./trailers)
26. [resWrite](./resWrite)
27. [resWriteRaw](./resWriteRaw)
28. [resRules](./resRules)
29. [resScript](./resScript)

## General（请求/响应通用协议）
1. [pipe](./pipe)
2. [delete](./delete)
3. [headerReplace](./headerReplace)

## Throttle（限制流量速度）
1. [reqDelay](./reqDelay)
2. [resDelay](./resDelay)
3. [reqSpeed](./reqSpeed)
4. [resSpeed](./resSpeed)

## Tools（调试工具）
1. [weinre](./weinre)
2. [log](./log)

## Settings（特殊设置）
1. [style](./style)
2. [lineProps](./lineProps)
3. [enable](./enable)
4. [disable](./disable)

## Filters（规则过滤器）
1. [ignore](./ignore)
2. [skip](./skip)
3. [excludeFilter](./excludeFilter)
4. [includeFilter](./includeFilter)
