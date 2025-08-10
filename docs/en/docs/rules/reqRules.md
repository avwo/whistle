# reqRules
Batch multiple rules for matching requests to meet request processing requirements in complex scenarios.

## Rule Syntax
``` txt
pattern reqRules://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Rule content, supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
```` txt
``` test.txt
* file://(<div>hello<div>)
* resType://text
```

``` test2.txt
* resAppend://(test)
```

www.example.com/path reqRules://{test.txt} reqRules://{test2.txt}
````
Visiting `https://www.example.com/path/to` returns:
``` txt
<div>hello<div>test
```
## Related Protocols
1. Request Phase Script Rules: [reqScript](./reqScript)
2. Response Phase Batch Rules: [resRules](./resRules)
3. Response Phase Script Rules: [resScript](./resScript)
4. More Complex Customization Requirements: [Plugin Development](../extensions/dev)
