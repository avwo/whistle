# cssBody
Replaces the existing response body with the specified content. (This only works for responses with `content-type` containing `css` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern cssBody://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path1 cssBody://(Hello) file://(-test-)
www.example.com/path2 cssBody://(Hello) file://(-test-) resType://js
www.example.com/path3 cssBody://(Hello) file://(-test-) resType://css
```
- Requesting `https://www.example.com/path1/to` results in a response of `<style>Hello</style>`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-`
- Requesting `https://www.example.com/path3/to` results in a response of `https://www.example.com/path3/to` `Hello`

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 cssBody://{body.txt} file://(-test-)
www.example.com/path2 cssBody://{body.txt} file://(-test-) resType://js
www.example.com/path3 cssBody://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to` results in `<style>Hello world.</style>`
- Requesting `https://www.example.com/path2/to` results in `-test-`
- Requesting `https://www.example.com/path3/to` results in `Hello world.`

#### Local/Remote Resources

```` txt
www.example.com/path1 cssBody:///User/xxx/test.css
www.example.com/path2 cssBody://https://www.xxx.com/xxx/params.css
# Editing a temporary file
www.example.com/path3 cssBody://temp/blank.css
````
## Associated Protocols
1. Replace the response content: [resBody](./resBody)
2. Inject content before the CSS response content: [cssPrepend](./cssPrepend)
3. Inject content after the CSS response content: [cssAppend](./cssAppend)
