# Filter
![Filter](https://user-images.githubusercontent.com/11450939/49695998-2bbe3f80-fbde-11e8-8c3a-a491492f4d80.png)

### Exclude Filter
表示只要匹配其中一个条件的请求就不会在当前页面的Network里面显示，多个条件用空格或换行分割，支持以下条件，/^(m|i|h|b|c|d|H):

1. `m:pattern`：pattern为字符串或正则表达式，匹配请求方法包含该字符串(不区分大小写)或匹配该正则的请求
2. `i:ip`：ip表示客户端ip或正则表达式，匹配客户端ip包含该字符串(不区分大小写)或匹配该正则的请求
3. `h:header`：header表示请求头rawData的某部分字符或正则表达式，匹配请求头包含该字符串(不区分大小写)或匹配该正则的请求
4. `H:host`：host表示Network里面的host字段，为请求的域名加端口，匹配请求host字段包含该字符串(不区分大小写)或匹配该正则的请求
5. `其它`：正则或普通字符串，匹配请求URL包含该字符串(不区分大小写)或匹配该正则的请求

> 可以通过右键 `Filter -> This URL 或 This Host` 快速过滤当前URL或host的请求

### Include Filter
表示如果里面设置了条件，则要匹配该条件，且不匹配 `Exclude Filter` 的请求才会显示在当前页面的Network里面，可设置的条件及分割符同 `Exclude Filter`。
