# reqPrepend
Inserts the specified content at the beginning of the existing request body (only valid for requests with a body, such as `POST` and `PUT`).
> ⚠️ Note: GET, HEAD, and other requests without a body are not affected.

## Rule Syntax
``` txt
pattern reqPrepend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path reqPrepend://(Hello) reqBody://(-test-) method://post
```
Requesting `https://www.example.com/path/to` will result in the request body becoming `Hello-test-`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path reqPrepend://{body.txt} reqBody://(-test-) method://post
````
Requesting `https://www.example.com/path/to` will result in the request body becoming `Hello world.-test-`.

#### Local/Remote Resources

```` txt
www.example.com/path1 reqPrepend:///User/xxx/test.txt
www.example.com/path2 reqPrepend://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 reqPrepend://temp/blank.txt
````

## Associated Protocols
1. Inject content before the request body: [reqBody](./reqBody)
2. Append content after the request body: [reqAppend](./reqAppend)
3. Inject content before the response body: [resPrepend](./resPrepend)
