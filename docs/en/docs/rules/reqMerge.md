# reqMerge
Intelligently merges the specified data object into the request content, supporting multiple request formats:
- Regular form (`application/x-www-form-urlencoded`)
- File upload form (`multipart/form-data`)
- JSON request (`application/json`)

## Rule Syntax
``` txt
pattern reqMerge://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Operation data object, supported from the following sources:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example

#### Inline Method
``` txt
www.example.com/path reqMerge://test=123 reqBody://(name=avenwu) reqType://form method://post
```
Request content received by the server when accessing `https://www.example.com/path/to`:
``` txt
name=avenwu&test=123
```

#### Inline Method
```` txt
``` reqMerge.json
a.b.c: 123
c\.d\.e: abc
```
www.example.com/path reqMerge://{reqMerge.json} reqBody://({"name":"avenwu"}) reqType://json method://post
````
Access `https://www.example.com/path/to` and capture the request content:
``` js
{"name":"avenwu","a":{"b":{"c":123}},"c.d.e":"abc"}
```

#### Local/Remote Resources
```` txt
www.example.com/path1 reqMerge:///User/xxx/test.json
www.example.com/path2 reqMerge://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 reqMerge://temp/blank.json
````

## Note: Request Size Limit

To ensure processing performance, `reqMerge` enforces a default size limit for request content.

*   **Limit Specification**: The automatic merge processing is only applied to requests with a body size **less than 2MB**. Requests exceeding this size will be skipped.
*   **How to Override**: If you need to handle larger requests, you can explicitly enable this capability by adding the following directive to your matching rule:

``` txt
pattern enable://reqMergeBigData
```
Once enabled, `reqMerge` will attempt to process larger request volumes. Please note that this may increase memory consumption and processing time.

## Associated Protocols
1. Replace with a keyword or regular expression: [reqReplace](./reqReplace)
2. Modify the response content object: [resMerge](./resMerge)
