# tpl
tpl is an enhanced version of the [file](./file) function, providing simple template engine functionality.

## Rule Syntax
``` txt
pattern tpl://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Operation content, supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Template Rules
1. Value format: `{key}` or `{{key}}`
2. `key`: A property in the request parameters

## Mock JSONP
1. Local File `/User/xxx/test.js`
``` js
{callback}({
  ec: 0
});
```
2. Rule Configuration
``` txt
https://www.example.com/test/tpl tpl:///User/xxx/test.js

# Supports remote URLs
# pattern tpl://https://example.com/template
```
3. Request `https://www.example.com/test/tpl?callback=test` Returns:
``` txt
test({
  ec: 0
});
```

For other functions, refer to [file](./file)
