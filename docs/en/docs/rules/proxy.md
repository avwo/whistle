# proxy (http-proxy)
The `proxy` (or `http-proxy`) directive forwards matching requests through a specified HTTP proxy server. These two directives have identical functionality and can be used interchangeably.

## Rule Syntax
``` txt
pattern proxy://ipOrDomain[:port] [filters...]
# Equivalent:
pattern http-proxy://ipOrDomain[:port] [filters...]
```
> `port` is optional. If left blank, the default port `80` will be used.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | IP + optional port or domain name + optional port<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Proxy requests to the HTTP proxy: `127.0.0.1:80`
www.example.com/path proxy://127.0.0.1 # Default port 80

# Proxy all requests for the current domain to the HTTP proxy: `127.0.0.1:8080`
www.example.com proxy://127.0.0.1:8080

# You can also use a domain name.
www.example.com/path proxy://test.proxy.com # Default port 80
www.example.com proxy://test.proxy.com:8080
```

## Advanced Usage
After proxying a request to the upstream proxy, by default the upstream proxy will use DNS to obtain the server IP address based on the requested domain name before continuing the request. If you want the upstream proxy to continue the request based on a specific IP address and port, you can do this:
``` txt
# Using query parameters
www.example.com proxy://127.0.0.1:8080?host=1.1.1.1
www.example.com proxy://127.0.0.1:8080?host=1.1.1.1:8080

# Enable via directive
www.example.com proxy://127.0.0.1:8080 1.1.1.1 enable://proxyHost
www.example.com proxy://127.0.0.1:8080 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` is equivalent to `host://1.1.1.1`

## Matching precedence with `host`

#### Default behavior

When a request matches both `host` and `proxy` rules:
- Only the `host` rule takes effect
- The `proxy` rule is automatically ignored

#### Modify Priority
| Configuration Method | Syntax | Effect |
|---------|------|------|
| **Prioritize proxy** | [`enable://proxyFirst`](./enable) or [`lineProps://proxyFirst`](./lineProps) | Only `proxy` takes effect (overrides `host`) |
| **Both take effect** | [`enable://proxyHost`](./enable) or [`lineProps://proxyHost`](./lineProps) | Both `proxy` and `host` take effect |

#### Usage Recommendations
- Use the default behavior in most scenarios
- Use `proxyFirst` only when special proxy logic is required
- Use `proxyHost` when dual matching is required
