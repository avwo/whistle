# 操作协议列表

## 特殊规则
1. [@（引入远程规则或设置客户端证书）](./@)
2. [%（设置插件的变量值）](./plugin-var)

## Map Local（用本地文件替换响应内容）
1. [file](/docs/rules/file)
2. [xfile](/docs/rules/xfile)
3. [tpl](/docs/rules/tpl)
4. [xtpl](/docs/rules/xtpl)
5. [rawfile](/docs/rules/rawfile)
6. [xrawfile](/docs/rules/xrawfile)

## Map Remote（返回其它 URL 的数据）
1. [https](/docs/rules/https)
2. [http](/docs/rules/http)
3. [wss](/docs/rules/wss)
4. [ws](/docs/rules/ws)
5. [tunnel](/docs/rules/tunnel)

## DNS Spoofing（修改请求 IP 地址）
1. [host](/docs/rules/host)
2. [xhost](/docs/rules/xhost)
3. [proxy](/docs/rules/proxy)
4. [xproxy](/docs/rules/xproxy)
5. [http-proxy](/docs/rules/http-proxy)
6. [xhttp-proxy](/docs/rules/xhttp-proxy)
7. [https-proxy](/docs/rules/https-proxy)
8. [xhttps-proxy](/docs/rules/xhttps-proxy)
9. [socks](/docs/rules/socks)
10. [xsocks](/docs/rules/xsocks)
11. [pac](/docs/rules/pac)

## Rewrite Request（修改请求数据）
1. [urlParams](/docs/rules/urlParams)
2. [pathReplace](/docs/rules/pathReplace)
3. [sniCallback](/docs/rules/sniCallback)
4. [method](/docs/rules/method)
5. [cipher](/docs/rules/cipher)
6. [reqHeaders](/docs/rules/reqHeaders)
7. [forwardedFor](/docs/rules/forwardedFor)
8. [ua](/docs/rules/ua)
9. [auth](/docs/rules/auth)
10. [cache](/docs/rules/cache)
11. [referer](/docs/rules/referer)
12. [attachment](/docs/rules/attachment)
13. [reqCharset](/docs/rules/reqCharset)
14. [reqCookies](/docs/rules/reqCookies)
15. [reqCors](/docs/rules/reqCors)
16. [reqType](/docs/rules/reqType)
17. [reqBody](/docs/rules/reqBody)
18. [reqMerge](/docs/rules/reqMerge)
19. [reqPrepend](/docs/rules/reqPrepend)
20. [reqAppend](/docs/rules/reqAppend)
21. [reqReplace](/docs/rules/reqReplace)
22. [reqWrite](/docs/rules/reqWrite)
23. [reqWriteRaw](/docs/rules/reqWriteRaw)
24. [reqRules](/docs/rules/reqRules)
25. [reqScript](/docs/rules/reqScript)

## Rewrite Reponse（修改响应数据）
1. [statusCode](/docs/rules/statusCode)
2. [replaceStatus](/docs/rules/replaceStatus)
3. [redirect](/docs/rules/redirect)
4. [locationHref](/docs/rules/locationHref)
5. [resHeaders](/docs/rules/resHeaders)
6. [responseFor](/docs/rules/responseFor)
7. [resCharset](/docs/rules/resCharset)
8. [resCookies](/docs/rules/resCookies)
9. [resCors](/docs/rules/resCors)
10. [resType](/docs/rules/resType)
11. [resBody](/docs/rules/resBody)
12. [resMerge](/docs/rules/resMerge)
13. [resPrepend](/docs/rules/resPrepend)
14. [resAppend](/docs/rules/resAppend)
15. [resReplace](/docs/rules/resReplace)
16. [htmlPrepend](/docs/rules/htmlPrepend)
17. [htmlBody](/docs/rules/htmlBody)
18. [htmlAppend](/docs/rules/htmlAppend)
19. [cssPrepend](/docs/rules/cssPrepend)
20. [cssBody](/docs/rules/cssBody)
21. [cssAppend](/docs/rules/cssAppend)
22. [jsPrepend](/docs/rules/jsPrepend)
23. [jsBody](/docs/rules/jsBody)
24. [jsAppend](/docs/rules/jsAppend)
25. [trailers](/docs/rules/trailers)
26. [resWrite](/docs/rules/resWrite)
27. [resWriteRaw](/docs/rules/resWriteRaw)
28. [resRules](/docs/rules/resRules)
29. [resScript](/docs/rules/resScript)

## General（请求/响应通用协议）
1. [pipe](/docs/rules/pipe)
2. [delete](/docs/rules/delete)
3. [headerReplace](/docs/rules/headerReplace)

## Throttle（限制流量速度）
1. [reqDelay](/docs/rules/reqDelay)
2. [resDelay](/docs/rules/resDelay)
3. [reqSpeed](/docs/rules/reqSpeed)
4. [resSpeed](/docs/rules/resSpeed)

## Tools（调试工具）
1. [weinre](/docs/rules/weinre)
2. [log](/docs/rules/log)

## Settings（特殊设置）
1. [style](/docs/rules/style)
2. [lineProps](/docs/rules/lineProps)
3. [enable](/docs/rules/enable)
4. [disable](/docs/rules/disable)

## Filters（规则过滤器）
1. [ignore](/docs/rules/ignore)
2. [skip](/docs/rules/skip)
3. [excludeFilter](/docs/rules/excludeFilter)
4. [includeFilter](/docs/rules/includeFilter)
