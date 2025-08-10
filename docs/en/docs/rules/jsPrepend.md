# jsPrepend
Inserts the specified content before the existing response body. (This only works for responses with `content-type` containing `javascript` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern jsPrepend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path1 jsPrepend://(Hello) file://(-test-)
www.example.com/path2 jsPrepend://(Hello) file://(-test-) resType://js
www.example.com/path3 jsPrepend://(Hello) file://(-test-) resType://css
```
- Request `https://www.example.com/path1/to`. The response content becomes
    ``` html
    <!DOCTYPE html>
    <script>Hello</script>-test-
    ```
- Request `https://www.example.com/path2/to`. The response content becomes `Hello-test-`
- Request The response content of `https://www.example.com/path3/to` becomes `-test-`

#### Embedded/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 jsPrepend://{body.txt} file://(-test-)
www.example.com/path2 jsPrepend://{body.txt} file://(-test-) resType://js
www.example.com/path3 jsPrepend://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to`, the response content becomes
    ``` html
    <!DOCTYPE html>
    <script>Hello world.</script> -test-
    ```
- Requesting `https://www.example.com/path2/to`, the response content becomes `Hello world.-test-`
- Request `https://www.example.com/path3/to`. The response content becomes `-test-`.

#### Local/Remote Resources

```` txt
www.example.com/path1 jsPrepend:///User/xxx/test.js
www.example.com/path2 jsPrepend://https://www.xxx.com/xxx/params.js
# Editing a temporary file
www.example.com/path3 jsPrepend://temp/blank.js
````

## Associated Protocols
1. Inject content before the response content: [reqPrepend](./reqPrepend)
2. Replace JavaScript response content: [jsBody](./jsBody)
3. Inject content after JavaScript response content: [jsPrepend](./jsPrepend)
