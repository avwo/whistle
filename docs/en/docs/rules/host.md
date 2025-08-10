# host
This command modifies the DNS resolution result of a request, resolving the specified request to a specific IP address (domain name) and port. This can be considered the ultimate system hosts configuration feature.

## Rule Syntax
``` txt
pattern host://ipOrDomain[:port] [filters...]
```
> If `port` is left blank, the original port of the request URL will be used. If it points to a domain name, it functions like `cname`.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | IP + optional port or domain name + optional port<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
# Can be omitted if only the IP or port is specified `host://`
www.example.com/test0 127.0.0.1 # Do not change the port; use the original port in the request URL.
www.example.com/test1 127.0.0.1:5173

# CNAME functionality
www.example.com/test2 host://www.test.com
www.example.com/test3 host://www.test.com:8080

# Advanced configuration: Get the target address from the request parameters. IncludeFilter ensures the parameter exists.
www.example.com/test4 host://`${query.target}$:8080` includeFilter:///[?&]target=[\w-]+/i
```
## Matching precedence with proxy
The following is an optimized document with clearer structure and more concise and accurate language:

---

## Matching precedence with host

#### Default behavior

When a request matches both `host` and `proxy` When configuring rules:
- Only `host` rules take effect
- `proxy` rules are automatically ignored

#### Changing Priority
| Configuration Method | Syntax | Effect |
|--------|------|------|
| **Prioritize proxy** | [`enable://proxyFirst`](./enable) or [`lineProps://proxyFirst`](./lineProps) | Only `proxy` takes effect (overrides `host`) |
| **Both take effect** | [`enable://proxyHost`](./enable) or [`lineProps://proxyHost`](./lineProps) | Both `proxy` and `host` take effect |

#### Usage Recommendations
- Use the default behavior in most scenarios
- Use `proxyFirst` only when special proxy logic is required
- Use `proxyHost` when dual matching is required

## FAQ
1. Differences from URL conversion:
    ``` txt
    # The URL received by the server is still www.example.com
    www.example.com 127.0.0.1:5173

    # The URL received by the server is http://127.0.0.1:5173
    www.example.com http://127.0.0.1:5173
    ```
2. Automatic downgrade to HTTP requests: If the configured target IP is `127.0.0.1` and HTTPS requests report errors, they will automatically downgrade to HTTP requests to facilitate access to local services. Users can disable this feature using the following rule:
    ``` txt
    # Disable automatic downgrade of local HTTPS requests
    pattern disable://auto2http
    ```
