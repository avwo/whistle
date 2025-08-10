# pac

Proxy Auto-Config (PAC) is a mechanism that automatically determines request proxy rules using JavaScript scripts, allowing you to dynamically select a proxy or direct connection based on criteria such as URL, domain name, and IP address.

## Rule Syntax
``` txt
pattern pac://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation content, supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
```` txt
# Embedded PAC Script
``` test.pac
function FindProxyForURL(url, host) {
  // ...
}
```
www.example.com/path pac://{test.pac}

# Values
www.example.com/path1 pac://{test2.pac}

# Local File
www.example.com/path3 pac:///User/xxx/test.pac

# Remote PAC Script
* pac://https://raw.githubusercontent.com/imweb/node-pac/master/test/scripts/normal.pac
````

## Advanced Usage
After proxying a request to an upstream proxy, by default the upstream proxy will use DNS to obtain the server IP address based on the requested domain name before continuing the request. If you want the upstream proxy to continue the request based on a specific IP address and port, you can do this:
``` txt
www.example.com pac://https://xxx/path/normal.pac 1.1.1.1 enable://proxyHost
www.example.com pac:///User/xxx/test.pac 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` Equivalent to `host://1.1.1.1`
