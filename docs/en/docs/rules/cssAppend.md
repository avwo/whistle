# cssAppend
Inserts the specified content after the existing response body. (This only works if the `content-type` response type contains `css` and the response status code includes a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern cssAppend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
```` txt
www.example.com/path1 cssAppend://(Hello) file://(-test-)
www.example.com/path2 cssAppend://(Hello) file://(-test-) resType://js
www.example.com/path3 cssAppend://(Hello) file://(-test-) resType://css
```
- Requesting `https://www.example.com/path1/to` results in a response of `-test-<style>Hello</style>`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-Hello`

#### Embedded/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 cssAppend://{body.txt} file://(-test-)
www.example.com/path2 cssAppend://{body.txt} file://(-test-) resType://js
www.example.com/path3 cssAppend://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to` results in a response of `-test-<style>Hello world.</style>`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-`
- Requesting `https://www.example.com/path3/to` results in a response of `-test-Hello world.`

#### Local/Remote Resources

```` txt
www.example.com/path1 cssAppend:///User/xxx/test.css
www.example.com/path2 cssAppend://https://www.xxx.com/xxx/params.css
# Editing a temporary file
www.example.com/path3 cssAppend://temp/blank.css
````

## Associated Protocols
1. Inject content before the response: [reqAppend](./reqAppend)
2. Inject content before CSS-type response content: [jsPrepend](./cssPrepend)
3. Replace CSS-type response content: [jsBody](./cssBody)
