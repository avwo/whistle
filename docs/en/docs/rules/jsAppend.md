# jsAppend
Inserts the specified content after the existing response body. (This only works if the `content-type` response type contains `javascript` and the status code includes a response body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a response body, such as 204 and 304, are not affected.

## Rule Syntax
``` txt
pattern jsAppend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path1 jsAppend://(Hello) file://(-test-)
www.example.com/path2 jsAppend://(Hello) file://(-test-) resType://js
www.example.com/path3 jsAppend://(Hello) file://(-test-) resType://css
```
- Requesting `https://www.example.com/path1/to` results in a response of `-test-<script>Hello</script>`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-Hello`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-`

#### Embedded/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 jsAppend://{body.txt} file://(-test-)
www.example.com/path2 jsAppend://{body.txt} file://(-test-) resType://js
www.example.com/path3 jsAppend://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to` results in a response of `-test-<script>Hello world.</script>`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-Hello world.`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-`

#### Local/Remote Resources

```` txt
www.example.com/path1 jsAppend:///User/xxx/test.js
www.example.com/path2 jsAppend://https://www.xxx.com/xxx/params.js
# Editing a temporary file
www.example.com/path3 jsAppend://temp/blank.js
````

## Associated Protocols
1. Inject content before the response: [reqAppend](./reqAppend)
2. Inject content before the JavaScript response: [jsPrepend](./jsPrepend)
3. Replace the JavaScript response: [jsBody](./jsBody)
