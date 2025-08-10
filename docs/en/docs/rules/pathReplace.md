# pathReplace
Provides functionality similar to JavaScript's String.replace() method, dynamically modifying the path portion of a URL using regular expressions or string matching.

> URL structure:
> ``` txt
> https://www.example.com:8080/path/to/resource?query=string
> \___/ \_____________/\___/\____________________________/
> |                 |           |           |
> Protocol (scheme) Host (host) Port (path) Path (path)
> ```

## Rule Syntax
``` txt
pattern pathReplace://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation data object, supported from the following channels: <br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.example.com/path pathReplace://123=abc
```
Visit `https://www.example.com/path/123?test=123&value=123`. The server receives the following URL: `https://www.example.com/path/abc?test=abc&value=abc`

#### Replace Multiple Strings

```` txt
``` test.json
test: name
123: abc
```
www.example.com/path2 pathReplace://{test.json}
````
Visit `https://www.example.com/path2/123?test=123&value=123`. The server receives the following URL: URL: `https://www.example.com/path2/abc?name=abc&value=abc`

#### Local/Remote Resources

```` txt
www.example.com/path1 pathReplace:///User/xxx/test.json
www.example.com/path2 pathReplace://https://www.xxx.com/xxx/params.json
# Editing a Temporary File
www.example.com/path3 pathReplace://temp/blank.json
````

## Associated Protocols
1. Modify request parameters: [urlParams](./urlParams)
2. Delete request parameters: [delete://urlParams.xxx](./delete)
