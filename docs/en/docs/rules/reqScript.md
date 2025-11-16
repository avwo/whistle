# reqScript
Dynamically generate rules during the request phase using JavaScript to implement complex request processing logic. The script can access request context information and dynamically generate matching rules.

## Rule Syntax
``` txt
pattern reqScript://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | JS script to generate rules. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
```` txt
``` test.js
if (method === 'GET') {
rules.push('* resType://text');
rules.push('* file://(<div>GET-Request</div>)');
} else {
rules.push('* statusCode://403');
}
```
www.example.com/path reqScript://{test.js}
````
Accessing `https://www.example.com/path/to` returns:

#### Available global variables

| Variables/Methods | Description |
|--------------------|----------------------------------------------------------------------|
| `url` | Full request URL |
| `method` | Request method (GET/POST, etc.) |
| `ip`/`clientIp` | Client IP address |
| `headers` | Request header object |
| `body` | Request body (max 16KB) |
| `rules` | Rule array, add new rules via push |
| `values` | Temporary value storage object |
| `render(tpl,data)` | Micro template rendering function |
| `getValue(key)` | Get the value in `Values` |
| `parseUrl` | Same as `url.parse` in Node.js |
| `parseQuery` | Same as `querystring.parse` in Node.js |

## Related Protocols
1. Request-phase script rules: [reqScript](./reqScript)
2. Request-phase batch rules: [reqRules](./reqScript)
3. Response-phase batch rules: [resRules](./resRules)
4. More complex customization requirements: [Plugin development](../extensions/dev)
