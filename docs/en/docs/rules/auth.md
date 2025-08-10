# auth
Modify the shortcut protocol for the `authorization` field in the request header and set authentication information.

## Rule Syntax
``` txt
pattern auth://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | `username:password` or an object containing `username` and `password`. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
```` txt
# Inline Mode
www.example.com/path auth://test:123

# Or
www.example.com/path auth://username=test&password=123

# Inline/Values
``` auth.json
username: test
password: 123
```

# Or
``` auth.json
{
  username: test,
  password: 123
}
```

www.example.com/path auth://{auth.json}

````

#### Local/Remote Resources

```` txt
www.example.com/path1 auth:///User/xxx/auth.json
www.example.com/path2 auth://https://www.xxx.com/xxx/auth.json
# By editing a temporary file
www.example.com/path3 auth://temp/blank.json
````
## Associated Protocols
1. Modify the request header directly: [reqHeaders://authorization=value](./reqHeaders)
