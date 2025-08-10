# resPrepend
Inserts the specified content at the beginning of the existing response body (only valid for status codes with a response body, such as `200`/`500`).
> ⚠️ Note: 204, 304, and other requests without a response body are not affected.

## Rule Syntax
``` txt
pattern resPrepend://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path resPrepend://(Hello) file://(-test-)
```
Requesting `https://www.example.com/path/to` will result in a response with
``` txt
<!DOCTYPE html>
Hello-test-
```

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path resPrepend://{body.txt} file://(-test-)
````
Requesting `https://www.example.com/path/to` will result in a response with
``` txt
<!DOCTYPE html>
Hello world.-test-
```

#### Local/Remote Resources

```` txt
www.example.com/path1 resPrepend:///User/xxx/test.txt
www.example.com/path2 resPrepend://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 resPrepend://temp/blank.txt
````

## Associated Protocols
1. Inject content before the response: [reqBody](./reqBody)
2. Append content after the response: [reqAppend](./reqAppend)
3. Inject content before the request: [reqPrepend](./reqPrepend)
