# operation

In Whistle, each rule consists of a matching pattern (`pattern`) and an operation (`operation`). The general syntax of `operation` is:

``` txt
protocol://[value]
```
- **protocol**: Specifies the operation type (e.g., `file`, `proxy`, `resReplace`, etc.)
- **value**: The operation content (supports multiple formats, see below)

## Inline Value
``` txt
pattern reqHeaders://x-proxy=Whistle # Set request headers
pattern statusCode://404 # Modify the status code
pattern file://({"ec":0}) # Respond to the request with inline content (the value enclosed in parentheses: `{"ec":0}`)
```

When the operation content (value) contains spaces, newlines, or special characters, the inline method cannot be used directly. Instead, use the following method:

## embedded value

```` txt
```ua.txt
Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1
```
pattern ua://{ua.txt}
````

Equivalent to

```` txt
``` headers.json
user-agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1
```
pattern reqHeaders://{headers.json}
````

## Values Reference

When an operation value needs to be shared by multiple rules, embedding it directly in the rules will prevent reuse. You can now store these values in the Values module of the Whistle interface and reference them using keys:
1. Create a key named `result.json` in the Values module and fill in the action content.
2. Reference them in the rule using `{result.json}`, for example: `www.test.com/cgi-bin/test file://{result.json}`

<img src="/img//values-demo1.png" width="420" />

## Files/Remote Resources
``` txt
pattern reqHeaders:///User/xxx/filepath # Load action content from a local file
pattern resHeadrs://https://example.com/config.json # Load a JSON object remotely
pattern resHeaders://temp/blank.json # Use a temporary file on the border
```
> ⚠️ Note: http/https/ws/wss/tunnel/host/enable/cache... Protocols such as HTTPS and HTTPS prohibit accessing content via file paths or remote URLs. For details, see the documentation for each protocol.

## Parentheses Used
In Whistle rules, the value portion of protocol://value can contain three types of indirect references:
1. `{key}` - References an embedded value
2. `remote-url` - References a remote resource address
3. `localfilepath` - References a local file path

When you need to directly reference the above content (rather than the content indirectly referenced) as the action content, you can enclose it in parentheses:
``` txt
protocol://(value)
```

Example:
1. `reqHeaders:///User/xxx/yyy.txt` - Loads the action content from the local file `/User/xxx/yyy.txt`
2. `reqHeaders://(/User/xxx/yyy.txt)` - Uses `/User/xxx/yyy.txt` directly as the action content

## Template Strings
Whistle provides a template string feature similar to ES6, allowing you to dynamically reference request information and apply it to rule configuration. The following template strings are supported:

##### General inline values
``` txt
pattern protocol://`...${version}...`
```

##### Inline values or Values references
```` txt

``` test.key
...${reqId}...
...${version}...
```
pattern protocol://`{test.key}`
````

##### Parenthesized content
```` txt
pattern protocol://`(...${now}...)`
````

##### String variables

| Variable name | Value |
| --------------------- | ------------------------------------------------------------ |
| `${now}` | Date.now() |
| `${random}` | Math.random() |
| `${randomUUID}` | crypto.randomUUID() |
| `${randomInt(n)}` or `${randomInt(n1-n2)}` | Selects a random positive integer from [0, n] or [n1, n2] (Added in: v2.9.104) |
| `${reqId}` | The ID assigned by Whistle to each request |
| `${url.protocol}` | url.parse(fullUrl).protocol |
| `${url.hostname}` | url.parse(fullUrl).hostname |
| `${url.host}` | url.parse(fullUrl).host |
| `${url.port}` | url.parse(fullUrl).port |
| `${url.path}` | url.parse(fullUrl).path |
| `${url.pathname}` | url.parse(fullUrl).pathname |
| `${url.search}` | url.parse(fullUrl).search |
| `${query.xxx}` | Value of request parameter `xxx` |
| `${url}` | Full request URL |
| `${querystring}` | url.parse(fullUrl).search \|\| '?' (not empty) |
| `${searchstring}` | url.parse(fullUrl).search \|\| '?' (not empty) |
| `${method}` | Request method |
| `${reqHeaders.xxx}` | Value of request header field `xxx` |
| `${resHeaders.xxx}` | Value of response header field `xxx` |
| `${version}` | Whistle version number |
| `${port}` | Whistle port number |
| `${host}` | The network interface IP address Whistle listens on when it starts (blank by default) |
| `${realPort}` | The port displayed in the Online dialog box of the Whistle interface (usually the Whistle port number) |
| `${realHost}` | The host displayed in the Online dialog box of the Whistle interface (usually the network interface IP address Whistle listens on) |
| `${clientIp}` | Client IP address |
| `${clientPort}` | Client port address |
| `${serverIp}` | Server IP address |
| `${serverPort}` | Server port address |
| `${reqCookies.xxx}` | The value of the request cookie `xxx` |
| `${resCookies.xxx}` | The value of the response cookie `xxx` |
| `${statusCode}` | The response status code |
| `${env.xxx}` | process.env.xxx |
| `${whistle.plugin-name}` | `value` of `whistle.plugin-name://value` or `plugin-name://value` |

> `${whistle.plugin-name}` can only have a value in plugin rules.

##### Example

````txt
``` test.txt
now: ${now}
random: ${random}
randomUUID: ${randomUUID}
reqId: ${reqId}
url.protocol: ${url.protocol}
url.hostname: ${url.hostname}
url.host: ${url.host}
url.port: ${url.port}
url.path: ${url.path}
url.pathname: ${url.pathname}
url.search; ${url.search}
query: ${query.name}
url: ${url}
querystring: ${querystring}
searchstring: ${searchstring}
method: ${method}
reqHeaders.accept: ${reqHeaders.accept}
resHeaders.content-type: ${resHeaders.content-type}
version: ${version}
port: ${port}
host: ${host}
realPort: ${realPort}
realHost: ${realHost}
clientIp: ${clientIp}
clientPort: ${clientPort}
serverIp: ${serverIp}
serverPort: ${serverPort}
reqCookies.test: ${reqCookies.test}
resCookies.test: ${resCookies.test}
statusCode: ${statusCode}
env.USER: ${env.USER}
```

www.test.com/index.html file://`{test.txt}`
````

Visit `https://www.test.com/index.html?name=avenwu` and the response content is:

``` txt
now: 1752301623295
random: 0.6819241513880432
randomUUID: e917b9fc-e2ef-4255-9209-11eb417235c5
reqId: 1752301623294-339
url.protocol: https:
url.hostname: www.test.com
url.host: www.test.com
url.port: 
url.path: /index.html?name=avenwu
url.pathname: /index.html
url.search; ?name=avenwu
query: avenwu
url: https://www.test.com/index.html?name=avenwu
querystring: ?name=avenwu
searchstring: ?name=avenwu
method: GET
reqHeaders.accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
resHeaders.content-type: 
version: 2.9.100
port: 8899
host: 
realPort: 8899
realHost: 
clientIp: 127.0.0.1
clientPort: 60582
serverIp: 
serverPort: 
reqCookies.test: 
resCookies.test: 
statusCode: 
env.USER: av
```
## Data Objects
In addition to text or binary content, the operation content may also be a JSON object. Whistle supports the following three data object formats:

#### JSON Format
``` js
{
  "key1": value1,
  "key2": value2,
  "keyN": valueN
}
```

#### Line Format
``` txt
key1: value1
key2: value2
keyN: valueN
```
> Separated by `colon+space`. If there is no `colon+space`, the first colon is used as the separator. If there is no colon, `value` is an empty string.

**Multi-level nesting:**
``` txt
a.b.c: 123
c\.d\.e: abc
```
Equivalent to:
``` json
{
  "a": {
  "b": {
    "c": 123
  }
},
"c.d.e": "abc"
}
```

#### Inline Format (Request Parameter Format)

``` txt
key1=value1&key2=value2&keyN=valueN
```
> It's best to encodeURIComponent both `key` and `value`.

## Operation Protocols
Each protocol (`protocol`) corresponds to a specific operation type and is used to handle matching requests. The protocol determines the operation type and the format requirements for the operation content. For detailed usage, see [Protocol List](./protocols).
