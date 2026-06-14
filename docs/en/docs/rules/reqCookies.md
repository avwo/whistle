# reqCookies
Modify the request `Cookie` header.

## Rule Syntax
``` txt
pattern reqCookies://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Cookie object, supported from the following sources:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching against:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

Cookie object structure: `key-value`

## Configuration Example
#### Inline Method
``` txt
www.example.com/path reqCookies://k1=v1&k2=v2
````
Add two request cookies to the request header: `k1: v1` / `k2: v2`

### Inline Mode
```` txt
``` cookies.json
key1: value1
key2: value2
```
# Or
``` cookies.json
{
key1: 'value1',
key2: 'value2'
}
```
www.example.com/path reqCookies://{cookies.json}
````
Add two request cookies to the request header: `key1: value1` / `key2: value2`

#### Local/Remote Resources

```` txt
www.example.com/path1 reqCookies:///User/xxx/test.json
www.example.com/path2 reqCookies://https://www.xxx.com/xxx/params.json
# By editing a temporary file
www.example.com/path3 reqCookies://temp/blank.json
````

## Associated Protocols {#related}

1. Delete request header field (`Delete Request Header`): [delete://reqHeaders.xxx](./delete)  
2. Delete request cookie (`Delete Request Cookie`): [delete://reqCookies.xxx](./delete)  
3. Set request cookie: [reqCookies](./reqCookies)  
4. Set request authorization header: [auth](./auth)  
5. More flexible way to modify request headers: [headerReplace](./headerReplace)
