# jsBody
Replaces the existing response body with the specified content. (This only works for responses with `content-type` containing `javascript` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern jsBody://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path1 jsBody://(Hello) file://(-test-)
www.example.com/path2 jsBody://(Hello) file://(-test-) resType://js
www.example.com/path3 jsBody://(Hello) file://(-test-) resType://css
```
- Requesting `https://www.example.com/path1/to` results in a response of `<script>Hello</script>`
- Requesting `https://www.example.com/path2/to` results in a response of `Hello`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-`

#### Embedded/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 jsBody://{body.txt} file://(-test-)
www.example.com/path2 jsBody://{body.txt} file://(-test-) resType://js
www.example.com/path3 jsBody://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to` results in a response of `<script>Hello world.</script>`
- Requesting `https://www.example.com/path2/to` results in a response of `Hello world.`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-`

#### Local/Remote Resources

```` txt
www.example.com/path1 jsBody:///User/xxx/test.js
www.example.com/path2 jsBody://https://www.xxx.com/xxx/params.js
# Editing a temporary file
www.example.com/path3 jsBody://temp/blank.js
````
## Set `<script>` Tag Attributes for Injected Scripts

Scripts injected into HTML pages via `jsBody` are automatically wrapped in `<script>` tags by Whistle. To set additional attributes for these tags—such as `nomodule`, `module`, `defer`, `async`, or `crossorigin`—you can use the `lineProps` parameter for configuration.

```txt
www.example.com/path1 jsBody://https://www.xxx.com/xxx/params.js lineProps://nomodule
www.example.com/path2 jsBody://https://www.xxx.com/xxx/params.js lineProps://module
www.example.com/path3 jsBody://https://www.xxx.com/xxx/params.js lineProps://defer
www.example.com/path4 jsBody://https://www.xxx.com/xxx/params.js lineProps://async
www.example.com/path5 jsBody://https://www.xxx.com/xxx/params.js lineProps://crossorigin
```

### Attribute Descriptions and Examples
| Attribute | Purpose | Configuration Example |
|-----------|---------|-----------------------|
| `nomodule` | Executes in traditional browsers; this script will run in browsers that do not support ES modules. | `lineProps://nomodule` |
| `module` | Declares the script as an ES module, enabling modular imports. | `lineProps://module` |
| `defer` | Loads asynchronously and executes after the document has been parsed. | `lineProps://defer` |
| `async` | Loads asynchronously and executes immediately after download. | `lineProps://async` |
| `crossorigin`| Enables Cross-Origin Resource Sharing (CORS) mode. | `lineProps://crossorigin` |

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
