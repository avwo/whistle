# resMerge
Intelligently merges the specified data object into the response content. Supports the following response types:
- JSON (response `content-type` contains the `json` keyword)
- JSONP (response `content-type` is empty or contains the `html`/`javascript` keywords)

## Rule Syntax
``` txt
pattern resMerge://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Operation data object. Supports retrieval from the following sources:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching against:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example

#### Inline Method
``` txt
www.example.com/path resMerge://test=123 file://({"name":"avenwu"})
```
Visiting `https://www.example.com/path/to`, the browser receives the following:
``` js
{"name":"avenwu","test":"123"}
```

#### Inline Method
```` txt
``` resMerge.json
a.b.c: 123
c\.d\.e: abc
```
www.example.com/path resMerge://{resMerge.json} file://({"name":"avenwu"})
````
Visiting `https://www.example.com/path/to` Content received by the browser:
``` js
{"name":"avenwu","a":{"b":{"c":123}},"c.d.e":"abc"}
```

#### Local/Remote Resources
```` txt
www.example.com/path1 resMerge:///User/xxx/test.json
www.example.com/path2 resMerge://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 resMerge://temp/blank.json
````

## Note: Response Size Limit

To ensure processing performance, `resMerge` enforces a default size limit for response content.

*   **Limit Specification**: The automatic merge processing is only applied to responses with a body size **less than 2MB**. Responses exceeding this size will be skipped.
*   **How to Override**: If you need to handle larger responses (e.g., for downloading files or processing large data interfaces), you can explicitly enable this capability by adding the following directive to your matching rule:

``` txt
pattern enable://resMergeBigData
```
Once enabled, `resMerge` will attempt to process larger response volumes. Please note that this may increase memory consumption and processing time.

## Association Protocol
1. Replace with a keyword or regular expression: [resReplace](./reqReplace)
2. Modify the request content object: [reqMerge](./resMerge)
