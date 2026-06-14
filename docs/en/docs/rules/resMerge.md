# resMerge
Intelligently merges specified data objects into the response body, suitable for modifying partial parameters without affecting the remaining content. Supports the following response types:
- JSON (response `content-type` contains the keyword `json`)
- JSONP (response `content-type` is null or contains the keywords `html`/`javascript`)

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

# or
www.example.com/path1 resMerge:///User/xxx/test.json lineProps://enableBigData
```
Once enabled, `resMerge` will attempt to process larger response volumes. Please note that this may increase memory consumption and processing time.

## Associated Protocols {#related}

1. Inject content before the response content (`Prepend To Body`): [resPrepend](./resPrepend)  
2. Inject HTML content before the response content (`Prepend HTML To Body`, response type must be `text/html`): [htmlPrepend](./htmlPrepend)  
3. Inject CSS content before the response content (`Prepend CSS To Body`, response type must be `text/html` or `text/css`): [cssPrepend](./cssPrepend)  
4. Inject JS content before the response content (`Prepend JS To Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsPrepend](./jsPrepend)  
5. Replace the response content (`Replace Body`): [resBody](./resBody)  
6. Replace the response content with HTML content (`Replace Body`, response type must be `text/html`): [htmlBody](./htmlBody)  
7. Replace the response content with CSS content (`Replace Body`, response type must be `text/html` or `text/css`): [cssBody](./cssBody)  
8. Replace the response content with JS content (`Replace Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsBody](./jsBody)  
9. Append content after the response content (`Append To Body`): [resAppend](./resAppend)  
10. Append HTML content after the response content (`Append HTML To Body`, response type must be `text/html`): [htmlAppend](./htmlAppend)  
11. Append CSS content after the response content (`Append CSS To Body`, response type must be `text/html` or `text/css`): [cssAppend](./cssAppend)  
12. Append JS content after the response content (`Append JS To Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsAppend](./jsAppend)  
13. Replace the response content using keywords or regular expressions (`Modify Body Text`): [resReplace](./resReplace)  
14. Override JSON/Form objects in the response content (`Modify Form/JSON`): [resMerge](./resMerge)  
15. Delete a property from a JSON/Form object in the response content (`Delete Form/JSON`): [delete://resBody.xxx](./delete)
