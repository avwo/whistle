# resAppend
Inserts the specified content after the existing response body (only valid for status codes with a response body, such as `200`/`500`).
> ⚠️ Note: Requests without a response body, such as 204 and 304, are not affected.

## Rule Syntax
``` txt
pattern resAppend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path resAppend://(Hello) file://(-test-)
```
Requesting `https://www.example.com/path/to` will result in the response content becoming `-test-Hello`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path resAppend://{body.txt} file://(-test-)
````
Requesting `https://www.example.com/path/to` will result in the response content becoming `-test-Hello world.`.

#### Local/Remote Resources

```` txt
www.example.com/path1 resAppend:///User/xxx/test.txt
www.example.com/path2 resAppend://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 resAppend://temp/blank.txt
````

## Associated Protocols
1. Append content to the response: [resPrepend](./resPrepend)
2. Inject content before the response: [resBody](./resBody)
3. Append content to the request: [reqPrepend](./reqPrepend)
