# resAppend
Inserts the specified content after the existing response body (only valid for status codes with a response body, such as `200`/`500`).
> ⚠️ Note: Requests without a response body, such as 204 and 304, are not affected.

## Rule Syntax
``` txt
pattern resAppend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path resAppend://(Hello) file://(-test-)
```
Requesting `https://www.example.com/path/to` will result in the response content becoming `-test-Hello`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path resAppend://{body.txt} file://(-test-)
````
Requesting `https://www.example.com/path/to` will result in the response content becoming `-test-Hello world.`.

#### Local/Remote Resources

```` txt
www.example.com/path1 resAppend:///User/xxx/test.txt
www.example.com/path2 resAppend://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 resAppend://temp/blank.txt
````

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
