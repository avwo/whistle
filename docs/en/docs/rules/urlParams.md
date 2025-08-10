# urlParams
Dynamically modify the query parameters of the request URL, supporting multiple parameter injection methods.

## Rule Syntax
``` txt
pattern urlParams://value [filters...]
```

| Parameter | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation data object, supported from the following channels:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.example.com/path urlParams://test=123
```
Accessing `https://www.example.com/path/to` The server receives URL: `https://www.example.com/path/to?test=123`

<img src="/img/url-params.png" width="360" />

```` txt
``` test.json
test1: 1
test2:
test3: 3
```
www.example.com/path2 urlParams://{test.json}
````
Accessing `https://www.example.com/path2/to` URL received by the server: `https://www.example.com/path2?test1=1&test2=&test3=3`

<img src="/img/url-params2.png" width="360" />

#### Local/Remote Resources

```` txt
www.example.com/path1 urlParams:///User/xxx/test.json
www.example.com/path2 urlParams://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 urlParams://temp/blank.json
````

## Related Protocols
1. More flexible way to modify request parameters: [pathReplace](./pathReplace)
2. Deleting request parameters: [delete://urlParams.xxx](./delete)
