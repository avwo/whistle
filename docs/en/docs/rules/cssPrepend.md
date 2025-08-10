# cssPrepend
Inserts the specified content before the existing response body. (This only works for responses with `content-type` containing `css` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern cssPrepend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path1 cssPrepend://(Hello) file://(-test-)
www.example.com/path2 cssPrepend://(Hello) file://(-test-) resType://js
www.example.com/path3 cssPrepend://(Hello) file://(-test-) resType://css
```
- Request `https://www.example.com/path1/to`. The response content becomes
  ``` html
  <!DOCTYPE html>
  <style>Hello</style>-test-
  ```
- Request `https://www.example.com/path2/to`. The response content becomes `-test-`
- Request The response content of `https://www.example.com/path3/to` becomes `Hello-test-`

#### Embedded/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path1 cssPrepend://{body.txt} file://(-test-)
www.example.com/path2 cssPrepend://{body.txt} file://(-test-) resType://js
www.example.com/path3 cssPrepend://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path1/to`, the response content becomes
  ``` html
  <!DOCTYPE html>
  <style>Hello world.</style> -test-
  ```
- Requesting `https://www.example.com/path2/to`, the response content becomes `-test-`
- Request `https://www.example.com/path3/to`. The response content becomes `Hello world.-test-`

#### Local/Remote Resources

```` txt
www.example.com/path1 cssPrepend:///User/xxx/test.css
www.example.com/path2 cssPrepend://https://www.xxx.com/xxx/params.css
# Editing a temporary file
www.example.com/path3 cssPrepend://temp/blank.css
````

## Associated Protocols
1. Inject content before the response content: [reqPrepend](./reqPrepend)
2. Replace CSS-type response content: [cssBody](./jsBody)
3. Inject content after CSS-type response content: [cssPrepend](./jsAppend)
