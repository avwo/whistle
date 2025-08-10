# htmlBody

Replaces the existing response body with the specified content. (This only works for responses with `content-type` containing `html` and a status code containing a body (e.g., `200`/`500`).)
> ⚠️ Note: Requests without a body, such as 204 and 304 responses, are not affected.

## Rule Syntax
``` txt
pattern htmlBody://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path htmlBody://(Hello) file://(-test-)
www.example.com/path2 htmlBody://(Hello) file://(-test-) resType://js
```
- Requesting `https://www.example.com/path/to` results in a response of `Hello`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-`

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path htmlBody://{body.txt} file://(-test-)
www.example.com/path2 htmlBody://{body.txt} file://(-test-) resType://css
````
- Requesting `https://www.example.com/path/to` results in a response of `Hello world.`
- Requesting `https://www.example.com/path2/to` results in a response of `-test-`

#### Avoiding Non-Standard Requests
When the API response type (Content-Type) is not standardized and returned as `text/html`, this may result in:
- The front-end mistakenly parsing the API data as HTML
- Injected content corrupts the original data structure
- Triggering front-end parsing errors

Use `enable://strictHtml` or `enable://safeHtml` mode to protect non-HTML content:
``` txt
www.example.com/path1 htmlBody://(test) file://(-test-) enable://strictHtml
www.example.com/path2 htmlBody://(test) file://([-test-]) enable://strictHtml
www.example.com/path3 htmlBody://(test) file://([-test-]) enable://safeHtml
www.example.com/path4 htmlBody://(test) file://(<div>Test</div>) enable://strictHtml
```
- Requesting `https://www.example.com/path1/to` results in a response of `-test-`
- Requesting `https://www.example.com/path2/to` results in a response of `[-test-]`
- Requesting `https://www.example.com/path3/to` results in a response of `[-test-]`
- Requesting `https://www.example.com/path4/to` results in a response of `test`

`safeHtml`/`strictHtml` feature reference: [enable://safeHtml](./enable), [lineProps://strictHtml](./lineProps)

#### Local/Remote Resources

```` txt
www.example.com/path1 htmlBody:///User/xxx/test.txt
www.example.com/path2 htmlBody://https://www.xxx.com/xxx/params.txt
# Editing a temporary file
www.example.com/path3 htmlBody://temp/blank.txt
````

## Associated Protocols
1. Replace the response content: [resBody](./resBody)
2. Inject content before the HTML response content: [htmlPrepend](./htmlPrepend)
3. Inject content after the HTML response content: [htmlBody](./htmlBody)
4. Validate the HTML content format: [enable://safeHtml](./enable), [lineProps://strictHtml](./lineProps)
