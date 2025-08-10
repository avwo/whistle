# ignore
This command is used to ignore matching rules for a specific protocol, or to ignore the currently configured matching rules.

## Rule Syntax
``` txt
pattern ignore://p1|p2|... [filters...]
# Equivalent to:
pattern ignore://p1 ignore://p2 ... [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Protocol name<br/> `*` indicates all protocols<br/> `-p` excludes `p`<br/> ⚠️ Loading data from files/remote URLs is not supported | [Protocol List](./protocols) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Ignore all rules, retaining only those for the `file` protocol.
www.example.com/path ignore://*|-file

# Ignore specific protocols: file, host
www.example.com/path2 ignore://file|host
```

## FAQ
`ignore` ignores matched rules for a specific protocol. Rules ignored in this way will not match other rules of the same type. To have a request ignore a rule and then continue to match other rules of the same type, use the [skip](./skip) command.
