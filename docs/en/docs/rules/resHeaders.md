# resHeaders
Dynamically modify response header information, supporting multiple data sources and batch operations.

## Rule Syntax
``` txt
pattern resHeaders://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation data object, supported from the following channels:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

## Configuration Example

#### Basic Configuration
``` txt
www.example.com/path resHeaders://x-proxy=Whistle
```
Access `https://www.example.com/path/to` adds a new response header:
``` txt
x-proxy: Whistle
```

#### Setting Multiple Response Headers

```` txt
``` test.json
x-test1: 1
x-test2:
x-test3: abc
```
www.example.com/path2 resHeaders://{test.json}

# Equivalent to: www.example.com/path2 resHeaders://x-test1=1&x-test2=&x-test3=abc
````
Visiting `https://www.example.com/path2/to` on Whistle Network or the backend server will show the new response header:
``` txt
x-test1: 1
x-test2:
x-test3: abc
```

#### Local/Remote Resources

```` txt
www.example.com/path1 resHeaders:///User/xxx/test.json
www.example.com/path2 resHeaders://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 resHeaders://temp/blank.json
````

## Related Protocols
1. More flexible way to modify response headers: [headerReplace](./headerReplace)
2. Deleting response header fields: [delete://resHeaders.xxx](./delete)
