# resCors
Sets Cross-Origin Resource Sharing (CORS) headers during the response phase to resolve cross-origin request issues.

## Rule Syntax
``` txt
pattern resCors://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | CORS object, supported from the following sources:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching against:<br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

CORS Object Structure:
``` text
origin: *
methods: POST
headers: x-test
credentials: true
maxAge: 300000
```

Corresponding response headers:

``` txt
access-control-allow-origin: *
access-control-allow-methods: POST
access-control-allow-headers: x-test
access-control-allow-credentials: true
access-control-max-age: 300000
```
> When the request method is `OPTIONS`, `access-control-allow-headers` -> `access-control-expose-headers`

## Configuration Example
#### Quick Mode
1. Set the response header `access-control-allow-origin: *` (does not support cookies)
``` txt
www.example.com/path resCors://*
```
2. Allow cookies
``` txt
# `enable` sets `access-control-allow-origin: http://reqOrigin` based on the request header `origin`
# and settings access-control-allow-credentials: true
www.example.com/path2 resCors://enable
```

#### Detailed Configuration Mode
```` txt
``` cors.json
origin: *
methods: POST
headers: x-test
credentials: true
maxAge: 300000
```
www.example.com/path resCors://{cors.json}

# Do not process OPTIONS requests
www.example.com/path2 resCors://{cors.json} excludeFilter://options
````
Set response headers:
``` txt
access-control-allow-origin: *
access-control-allow-methods: POST
access-control-allow-headers: x-test
access-control-allow-credentials: true
access-control-max-age: 300000
```
#### Local/Remote Resources

```` txt
www.example.com/path1 resCors:///User/xxx/test.json
www.example.com/path2 resCors://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 resCors://temp/blank.json
````

## Associated Protocols
1. Delete response headers: [delete://resHeaders.orogin](./delete)
2. Set the request cross: [resCors](./resCors)
