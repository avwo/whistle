# reqCors
Sets the Cross-Origin Resource Sharing (CORS) header for the request to resolve cross-origin request issues.

## Rule Syntax
``` txt
pattern resCors://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | CORS object, supported from the following sources:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example

#### Quick Mode
``` txt
www.example.com/path reqCors://*
```
Set the request header `origin: *`

#### Detailed Configuration Mode
```` txt
``` cors.json
origin: *
method: POST
headers: x-test
```
www.example.com/path reqCors://{cors.json}
````
Setting Request Headers:
``` txt
origin: *
access-control-request-method: POST
access-control-request-headers: x-test
```
#### Local/Remote Resources

```` txt
www.example.com/path1 reqCors:///User/xxx/test.json
www.example.com/path2 reqCors://https://www.xxx.com/xxx/params.json
# Editing a Temporary File
www.example.com/path3 reqCors://temp/blank.json
````

## Associated Protocols
1. Delete request headers: [delete://reqHeaders.orogin](./delete)
2. Set the response cross-correspondence: [resCors](./resCors)
