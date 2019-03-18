# reqMerge
> 修改表单请求的内容，包括普通的表单、上传表单及请求类型为JSON的内容(`Content-Type: application/json`)，
其功能是通过`reqMerge://jsonData`指定的JSON对象来覆盖请求表单或对应JSON对象字段，如果是`GET`请求的表单，则会直接修改URL参数。

> 修改其它类型的请求内容，可以用[reqReplace](reqReplace.html)

配置方式：

	pattern reqMerge://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	field1: value1
	field2: value2
	filedN: valueN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

### 例子

1. GET请求：

```
www.test.com/cgi-bin/get-data reqMerge://(a=1&b=2)
```
> 一般配置左边是pattern、右边是operator，如果pattern和operator可以区分开来则位置可以调换(高亮显示的颜色不一样)，有关pattern可以参考：[匹配模式](../pattern.html)

上述配置，GET请求 `https://www.test.com/cgi-bin/get-data?x=2&a=0` url会在whistle里面被替换成 `https://www.test.com/cgi-bin/get-data?x=2&a=1&b=2`，即后台收到的url是被修改后的；`reqMerge://(a=1&b=2)` 中括号里面即为操作值，操作值可以有多种写法，具体参考：[操作值](../data.html)

2. POST请求

```
www.test.com/cgi-bin/send reqMerge://(a=1&b=2)
```

上述配置，POST请求 `https://www.test.com/cgi-bin/send` 里面的内容(假设为：`x=2&a=0`)会被替换成 `x=2&a=1&b=2`。

3. 上传表单：用于修改上传表单的内容字段
```
www.test.com/cgi-bin/upload reqMerge://{text.json}
```

Values里面的test.json
```
{
    "name1": "value1",
    "name2": "value2",
    "file1": {
        "filename": "text.txt",
        "content": "xxxxxxxxxxxxxxx"
    }
}
```
同样该上传表单经过whistle后对应的字段会别修改或添加新的字段。

4. 修改请求类型为JSON的请求
```
www.test.com/cgi-bin/post-json reqMerge://{text.json}
```
Values里面的test.json
```
{
    "name1": "value1",
    "name2": "value2",
    "test": {
        "test1": "11111",
        "test2": "22222"
    }
}
```
请求 `www.test.com/cgi-bin/post-json` 的 `Content-Type` 必须为 `application/json`，且假设请求内容为：
```
{"name2":123,"name3":333,"test":{"test1":1,"test3":{"test21":21}}}
```
则请求经过whistle后到后台收到的内容为：
```
{"name1":"value1","name2":"value2","name3":333,"test":{"test1":"11111","test2":"22222","test3":{"test21":21}}}
```

> 括号的写法见：[Rules的特殊操作符({}、()、<>)](../webui/rules.html)

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
