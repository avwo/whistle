# resRules
Batch set multiple rules for matching requests during the response phase to meet request processing requirements in complex scenarios.

## Rule Syntax
``` txt
pattern resRules://value [filters...]
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

www.example.com/path resRules://{test.txt} resRules://{test2.txt}
````
Accessing `https://www.example.com/path/to` does not execute `* file://(<div>hello<div>)` (because the rules in resRules are executed during the response phase).

## Related Protocols
1. Request-Phone Script Rules: [reqScript](./reqScript)
2. Response-Phone Batch Rules: [reqRules](./resRules)
3. Response-Phone Script Rules: [resScript](./resScript)
4. More Complex Customization Requirements: [Plugin Development](../extensions/dev)
