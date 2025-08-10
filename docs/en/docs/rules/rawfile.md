# rawfile
rawfile is an enhanced version of [file](./file). In addition to supporting all the features of [file](./file), it also allows you to define a complete HTTP response in a file, including:
- Response status code
- Response headers
- Response content

## Rule Syntax
``` txt
pattern rawfile://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Operation content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching against:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Mock Interface
1. Local File `/User/xxx/raw.txt`
    ``` js
    HTTP/1.1 500 OK
    Content-Type: application/json
    X-Custom-Header: value

    {
      "status": "success",
      "data": "your content here"
    }
2. Configure Rules
    ``` txt
    https://www.example.com/test/rawfile tpl:///User/xxx/raw.txt

    # Equivalent to
    # https://www.example.com/test/rawfile file:///User/xxx/test.json replaceStatus://500 resType://json resHeaders://x-custom-header=value

    # Supports remote URLs
    # pattern rawfile://https://example.com/raw.json
    ```
3. Request `https://www.example.com/test/rawfile` Returns:
    ``` txt
    // 状态码
    500

    // 响应头
    content-type: application/json
    x-custom-header: value
    content-length: 56

    // 响应内容
    {
      "status": "success",
      "data": "your content here"
    }
    ```

For other functions, see: [file](./file)
