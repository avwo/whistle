# socks
The `socks` directive is used to forward matching requests through a specified SOCKS5 proxy server.

## Rule Syntax
``` txt
pattern socks://ipOrDomain[:port] [filters...]
```
> `port` is optional. If left blank, the default port `443` will be used.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | IP + optional port or domain name + optional port<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
# Proxy requests to a SOCKS5 proxy: `127.0.0.1:443`
www.example.com/path socks://127.0.0.1 # Default port 443

# Proxy all requests for the current domain to the SOCKS5 proxy: `127.0.0.1:8080`
www.example.com socks://127.0.0.1:8080

# You can also use a domain name.
www.example.com/path socks://test.proxy.com # Default port 443
www.example.com socks://test.proxy.com:8080
```

## Advanced Usage
By default, the upstream proxy resolves the requested domain name. However, in some scenarios, you may want to force the proxy to access a specific target IP directly (skipping DNS resolution), for example:
- Bypassing DNS poisoning
- Directly accessing a specific backend IP
- Testing services in different environments
``` txt
# Using query parameters
www.example.com socks://127.0.0.1:8080?host=1.1.1.1
www.example.com socks://127.0.0.1:8080?host=1.1.1.1:8080

# Enabling via directives
www.example.com socks://127.0.0.1:8080 1.1.1.1 enable://proxyHost
www.example.com socks://127.0.0.1:8080 1.1.1.1:8080 enable://proxyHost
````
> `1.1.1.1` is equivalent to `host://1.1.1.1`

## Notes  
The `socks` protocol only applies to the substituted URL (i.e., the `Final URL` shown in the Overview). If the `Final URL` is empty, it will take effect on the original request URL.  

For example, with the rule:  
```  
www.example.com/api www.example.com proxy://127.0.0.1:1234  
```  
When a request is made to `https://www.example.com/api/path`, Whistle processes it and changes the URL to `https://www.example.com/path` (this becomes the `Final URL`). Although the intention is to proxy this request to `127.0.0.1:1234`, the `proxy` rule only matches the original domain `www.example.com/api` before substitution. Since the converted `Final URL` is now `www.example.com/path`, this rule will not be triggered.  

To ensure the rule also applies to the substituted request, you can break it into two separate rules:  
```  
www.example.com/api www.example.com  
www.example.com proxy://127.0.0.1:1234  
```  

This way, the original request is first rewritten by the first rule, generating a new `Final URL`. Then, the second `proxy` rule matches this new URL and successfully proxies the request to `127.0.0.1:1234`.
