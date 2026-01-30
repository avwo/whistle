# cache

The `cache` protocol is used to quickly set cache control headers for responses, helping to manage caching behavior for browsers and servers. It can set caching policies for matched responses, including:
- Setting a fixed cache duration
- Disabling caching (`no-cache`)
- Completely prohibiting storage (`no-store`)

This can help optimize website performance or ensure specific resources are not cached.

## Rule Syntax

`cache` supports multiple ways to set caching policies:

### 1. Inline Value (Direct Specification)
Specify the caching policy directly in the rule.
```txt
# Set cache for 5 seconds. Supports positive integers, 0, and negative integers.
pattern cache://5 [lineProps...] [filters...]

# Set cache headers: `cache-control: no-cache`, `pragma: no-cache`
# `no-cache` can be abbreviated as `no`.
pattern cache://no-cache [lineProps...] [filters...]

# Set cache headers: `cache-control: no-store`, `pragma: no-cache`
pattern cache://no-store [lineProps...] [filters...]
```

**Examples:**
```txt
https://example.com/api/data cache://no-cache
https://example.com/static/js cache://86400  # Cache for 24 hours
```

### 2. Embedded Value (Using Code Block)
Use this method when the caching policy needs to be reused or is complex.
````txt
pattern cache://{custom-key} [lineProps...] [filters...]

``` custom-key
no-cache
```
````

### 3. Referencing a Value from the Values Panel
Reference a caching policy pre-defined in the `Values` panel.
```txt
pattern cache://{key-of-values} [lineProps...] [filters...]
```
**Prerequisite:** A key named `key-of-values` with the caching policy as its value must exist in `Values`.

### 4. File/Remote URL Loading
**Currently NOT supported** to dynamically load cache configuration from a local file or remote URL.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | Caching policy value:<br>• **Number**: Cache duration in seconds (e.g., `60` means cache for 60 seconds)<br>• **no-cache** or **no**: Allows caching but requires revalidation on each use<br>• **no-store**: Completely prohibits caching<br>• Supports inline, embedded, and Values references<br>• ⚠️ Loading from files or remote URLs is not supported |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

**Response Headers Affected:**
- `Cache-Control`
- `Expires`
- `Pragma`

## Caching Policy Explanation

| Policy | Meaning | Typical Use Cases |
| :--- | :--- | :--- |
| **Number (e.g., `60`)** | Caches the resource for the specified number of seconds | Static resources, API responses that don't change often |
| **no-cache** (or **no**) | Allows caching but must validate before each use | Frequently changing content, such as user data, real-time quotes |
| **no-store** | Completely prohibits caching any version | Sensitive data, payment pages, one-time tokens |

## Configuration Examples

### Basic Examples
```txt
# Cache static resources for 1 hour
https://example.com/static cache://3600

# Disable caching for API endpoints
https://example.com/api cache://no-cache

# Prohibit caching for sensitive data
https://example.com/account cache://no-store
```

### Using Embedded Values
````txt
https://example.com/reports cache://{report-cache-policy}

``` report-cache-policy
no-cache
```
````

### Using with Filters
Set caching only for specific response status codes:
```txt
https://example.com/api cache://300 includeFilter://s:200
```

### Referencing Configuration from Values
Assuming the `static-cache` configuration already exists in Values:
```txt
https://example.com/assets cache://{static-cache}
```

## How It Works & Related Protocols

1. **Core Principle**: The `cache` protocol automatically sets the corresponding cache control headers:

   - `cache://5` sets:
     ```http
     Cache-Control: max-age=5
     Expires: [Current time + 5 seconds]
     ```
   
   - `cache://no-cache` sets:
     ```http
     Cache-Control: no-cache
     Pragma: no-cache
     ```
   
   - `cache://no-store` sets:
     ```http
     Cache-Control: no-store
     Pragma: no-cache
     ```

2. **Related Protocols**:
   - **Disable Caching**: A more thorough cache disabling solution that also removes cache-related headers from both requests and responses. See: [disable://cache](./disable)
   - **Manual Header Setting**: For more complex cache control, you can use the [`resHeaders`](./resHeaders) protocol to manually set cache headers.

## Notes
- Cache duration is in seconds; decimals are not supported.
- Setting `no-cache` does not mean "do not cache" but rather "must validate before use".
- For scenarios requiring complete cache disabling, it is recommended to also use the [`disable://cache`](./disable) protocol.
- Actual caching behavior is also influenced by server configuration and browser implementation.
