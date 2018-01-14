# 数据格式
多参数的情形，需要用多个`key:value`形式来存储，为方便内联的operator-uri或书写方便，whistle提供了以下几种方式来设置这些参数值。

1. 正常的JSON格式
```json
{
  "key1": value1,
  "key2": value2,
  "keyN": valueN
}
```

2. 请求参数格式
```
key1=value1&key2=value2&keyN=valueN
```

  如果key或value有空白字符用`encodeURIComponent`转换成实体编码，whistle会自动通过Node的`querystring.parse`把URI里面的值解析成JSON对象。
	
3. 分隔符格式
```
key1: value1
key2: value2
keyN: valueN
```
