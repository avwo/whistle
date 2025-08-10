# reqAppend
Inserts the specified content after the existing request body (only valid for requests with a body, such as `POST` and `PUT`).
> ⚠️ Note: GET, HEAD, and other requests without a body are not affected.

## Rule Syntax
``` txt
pattern reqAppend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filters Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path reqAppend://(Hello) reqBody://(-test-) method://post
```
Requesting `https://www.example.com/path/to` will result in the request body becoming `-test-Hello`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path reqAppend://{body.txt} reqBody://(-test-) method://post
````
Requesting `https://www.example.com/path/to` will result in the request body becoming `-test-Hello world.`.

#### Local/Remote Resources

```` txt
www.example.com/path1 reqAppend:///User/xxx/test.txt
www.example.com/path2 reqAppend://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 reqAppend://temp/blank.txt
````

## Associated Protocols
1. Append content to the request body: [reqPrepend](./reqPrepend)
2. Inject content before the request body: [reqBody](./reqBody)
3. Append content to the response body: [resPrepend](./resPrepend)
