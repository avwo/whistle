# pathReplace
Provides functionality similar to JavaScript's String.replace() method, dynamically modifying the path portion of a URL using regular expressions or string matching.

> URL structure:
> ``` txt
> https://www.example.com:8080/path/to/resource?query=string
> \___/ \_____________/\____/\____________________________/
> |                 |           |           |
> Protocol (scheme) Host (host) Port (path) Path (path)
> ```
> 
> The `path` section refers to `path/to/resource?query=string`, which excludes the leading `/`

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

## Notes  
The following configuration is intended to remove a specific path segment:  
```txt  
www.example.com/api/ pathReplace://(/api/=/)  
```  

**Expected outcome:**  
Replace `/api/` in `https://www.example.com/api/xxx` with `/`, resulting in `https://www.example.com/xxx`.  

**Actual issue:**  
Whistle interprets `/api/` as a regular expression rather than a plain string, causing extra slashes to appear after replacement:  
`https://www.example.com///xxx`.

> Even if `/api/` is treated as a string, it cannot match `api/xxx/...`. The path matched by pathReplace does not contain the leading `/`

**Solution:**  

```txt  
www.example.com pathReplace://(/^api//=)
```  
> Regular expressions in Whistle rules do not require escaping `/`.
>
> New versions of Whistle can also use `delete://pathname.0` to delete the `api/` path segment in the above URL. For details, see [delete://pathname.xxx](./delete)

## Related Protocols
1. Modify request parameters: [urlParams](./urlParams)
2. Delete the path: [delete://pathname.xxx](./delete)
3. Delete request parameters: [delete://urlParams.xxx](./delete)
