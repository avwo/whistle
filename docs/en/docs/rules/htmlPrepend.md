# htmlPrepend
Inserts the specified content before the existing response body. (This only works for responses with `content-type` containing `html` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: 204, 304, and other requests without a body are not affected.

## Rule Syntax
``` txt
pattern htmlPrepend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path htmlPrepend://(Hello) file://(-test-)
www.example.com/path2 htmlPrepend://(Hello) file://(-test-) resType://js
```
- Request `https://www.example.com/path/to`. The response content becomes
    ``` html
    <!DOCTYPE html>
    Hello-test-
    ```
- Request `https://www.example.com/path2/to`. The response content becomes `-test-`

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path htmlPrepend://{body.txt} file://(-test-)
www.example.com/path2 htmlPrepend://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path/to` results in the response content becoming
    ``` html
    <!DOCTYPE html>
    Hello world.-test-
    ```
- Requesting `https://www.example.com/path2/to` results in the response content becoming `-test-`

#### Avoiding Non-Standard Requests
When the API response type (Content-Type) is non-standardly returned as `text/html`, this may result in:
- The frontend mistakenly parsing the API data as HTML
- Injecting content that corrupts the original data structure
- Causing frontend parsing errors

Use enable://strictHtml or enable://safeHtml mode to protect non-HTML content:
``` txt
www.example.com/path1 htmlPrepend://(test) file://(-test-) enable://strictHtml
www.example.com/path2 htmlPrepend://(test) file://([-test-]) enable://strictHtml
www.example.com/path3 htmlPrepend://(test) file://([-test-]) enable://safeHtml
www.example.com/path4 htmlPrepend://(test) file://(<div>Test</div>) enable://strictHtml
```
- Requesting `https://www.example.com/path1/to` results in a response of `-test-`
- Requesting `https://www.example.com/path2/to` results in a response of `[-test-]`
- Requesting `https://www.example.com/path3/to` results in a response of `[-test-]`
- Requesting `https://www.example.com/path4/to` results in a response of
    ``` html
    <!DOCTYPE html>
    test<div>Test</div>
    ```

`safeHtml`/`strictHtml` function reference: [enable://safeHtml](./enable), [lineProps://strictHtml](./lineProps)

#### Local/Remote Resources

```` txt
www.example.com/path1 htmlPrepend:///User/xxx/test.txt
www.example.com/path2 htmlPrepend://https://www.xxx.com/xxx/params.txt
# Editing a temporary file
www.example.com/path3 htmlPrepend://temp/blank.txt
````

## Associated Protocols
1. Inject content before the response: [reqPrepend](./reqPrepend)
2. Replace the HTML response content: [htmlBody](./htmlBody)
3. In HTML Inject content after the response content of the type: [htmlPrepend](./htmlPrepend)
4. Verify the HTML content format: [enable://safeHtml](./enable), [lineProps://strictHtml](./lineProps)
