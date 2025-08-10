# trailers
Modify or add trailers (`trailers`) to responses using `Transfer-Encoding: chunked`. Trailers are additional HTTP header fields sent after the response body of a chunked transfer.
HTTP Tailers Function: https://http.dev/trailer

## Rule Syntax
``` txt
pattern trailers://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation data object, supported from the following sources:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

## Configuration Example
#### Basic Configuration
``` txt
# Set the request header `x-proxy: Whistle`
www.example.com/path trailers://x-proxy=Whistle
```

#### Setting Multiple Request Headers

```` txt
``` test.json
x-test1: 1
x-test2:
x-test3: abc
```
www.example.com/path2 trailers://{test.json}

# Equivalent to: www.example.com/path2 trailers://x-test1=1&x-test2=&x-test3=abc
````

#### Local/Remote Resources

```` txt
www.example.com/path1 trailers:///User/xxx/test.json
www.example.com/path2 trailers://https://www.xxx.com/xxx/params.json
# Editing a Temporary File
www.example.com/path3 trailers://temp/blank.json
````

## Associated Protocols
1. Delete request header field: [delete://trailers.xxx](./delete)
