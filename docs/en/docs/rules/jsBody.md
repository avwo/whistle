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

## Associated Protocols
1. Replace the response content: [resBody](./resBody)
2. Inject content before the JavaScript response content: [jsPrepend](./jsPrepend)
3. Inject content after the JavaScript response content: [jsBody](./jsBody)
