# style

Customize the display style of request rows in the Network list, including font color, style, background color, and more.

## Rule Syntax
``` txt
pattern style://color=@value&fontStyle=value&bgColor=@value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Supported style attributes:<br/>• `color` - Font color (`@hex` or CSS color name, such as `red`)<br/>• `fontStyle` - Font style (such as `italic`, `bold`) See [font-style](https://developer.mozilla.org/en-US/docs/Web/CSS/font-style)<br/>• `bgColor` - Background color (@hex or CSS color name, such as `red`) | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.test.com style://color=@fff&fontStyle=italic&bgColor=red
```
<img src="/img/style.png" width="1000" />
