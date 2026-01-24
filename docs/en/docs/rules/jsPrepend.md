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

## Set `<script>` Tag Attributes for Injected Scripts

Scripts injected into HTML pages via `jsPrepend` are automatically wrapped in `<script>` tags by Whistle. To set additional attributes for these tags—such as `nomodule`, `module`, `defer`, `async`, or `crossorigin`—you can use the `lineProps` parameter for configuration.

```txt
www.example.com/path1 jsPrepend://https://www.xxx.com/xxx/params.js lineProps://nomodule
www.example.com/path2 jsPrepend://https://www.xxx.com/xxx/params.js lineProps://module
www.example.com/path3 jsPrepend://https://www.xxx.com/xxx/params.js lineProps://defer
www.example.com/path4 jsPrepend://https://www.xxx.com/xxx/params.js lineProps://async
www.example.com/path5 jsPrepend://https://www.xxx.com/xxx/params.js lineProps://crossorigin
```

### Attribute Descriptions and Examples
| Attribute | Purpose | Configuration Example |
|-----------|---------|-----------------------|
| `nomodule` | Executes in traditional browsers; this script will run in browsers that do not support ES modules. | `lineProps://nomodule` |
| `module` | Declares the script as an ES module, enabling modular imports. | `lineProps://module` |
| `defer` | Loads asynchronously and executes after the document has been parsed. | `lineProps://defer` |
| `async` | Loads asynchronously and executes immediately after download. | `lineProps://async` |
| `crossorigin`| Enables Cross-Origin Resource Sharing (CORS) mode. | `lineProps://crossorigin` |

## Associated Protocols
1. Inject content before the response content: [reqPrepend](./reqPrepend)
2. Replace JavaScript response content: [jsBody](./jsBody)
3. Inject content after JavaScript response content: [jsPrepend](./jsPrepend)
