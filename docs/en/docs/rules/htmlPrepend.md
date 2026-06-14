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
