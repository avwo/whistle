# dns
Use the specified DNS server for domain resolution of matching requests. Supports traditional DNS and secure DNS (DoH).

## Rule Syntax
``` txt
pattern dns://dnsServer [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | DNS server address. Two formats supported:<br/>• **Traditional DNS**: IP or IP:port<br/>• **Secure DNS (DoH)**: DoH service URL starting with `https://` | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Value Parameter

| Type | Format | Examples |
| ------------------ | ------------ | ----------------------------------------------------------------------- |
| Traditional DNS | IP or IP:port | `8.8.8.8`, `8.8.8.8:53`, `[::1]:53` |
| **Secure DNS (DoH)** | HTTPS URL | `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query` |

## Configuration Example

``` txt
# Traditional DNS
example.com dns://8.8.8.8
*.google.com dns://8.8.8.8:53

# Secure DNS (DoH) - Google
*.google.com dns://https://dns.google/dns-query

# Secure DNS (DoH) - Cloudflare
example.com dns://https://cloudflare-dns.com/dns-query
```

## Relationship with host

- **host**: Directly maps domain to IP, equivalent to modifying hosts file
- **dns**: Specifies which DNS server to use for domain resolution

When a request matches both `host` and `dns`:
- If `host` maps directly to an IP, no DNS resolution is needed; `dns` rule has no effect
- If `host` maps to a domain (CNAME), the domain is resolved using the server specified by the `dns` rule
