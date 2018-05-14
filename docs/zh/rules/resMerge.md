# reqMerge
> 修改响应类型为`application/json`或`text/javascript`的响应内容，其功能是通过`resMerge://jsonData`指定的JSON对象覆盖响应内容里面的JSON对象，请个文本响应类型的修改可以参考：[resReplace](resReplace.html)

配置方式：
```
pattern resMerge://filepath
```
filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	field1: value1
	field2: value2
	filedN: valueN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

### 例子
1. 普通的返回JSON对象的请求：
```
www.test.com/cgi-bin/get-data resMerge://(name=1&value=2)
```
> 一般配置左边是pattern、右边是operator，如果pattern和operator可以区分开来则位置可以调换(高亮显示的颜色不一样)，有关pattern可以参考：[匹配模式](../pattern.html)

上述配置，请求 `https://www.test.com/cgi-bin/get-data?xxx` 如果响应类型为 `application/json`，且返回内容为json格式：
```
{"name":"test"}
```
经过whistle后在浏览器会收到：
```
{"name":1,"value":2}
```
> 覆盖方式是深度覆盖

2. jsonp请求(jsonp请求的返回类型必须为`text/javascript`)：
```
www.test.com/cgi-bin/test-jsonp resMerge://{jsonp.json}
```

Values里面的`jsonp.json`对象：
```
{
  "name": "avenwu",
  "obj": {
    "test": 1,
    "new": 2 
  }
}
```
上述配置，请求 `https://www.test.com/cgi-bin/get-data?xxx` 如果响应类型为 `application/json`，且返回内容为json格式：
```
{"name":"test","obj":{"test":"hehe"}}
```
经过whistle后在浏览器会收到：
```
{"name": "avenwu","obj":{"test":"hehe","new":2}}
```
> 括号的写法见：[Rules的特殊操作符({}、()、<>)](../webui/rules.html)
