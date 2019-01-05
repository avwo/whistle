# statusCode

设置响应状态码(状态码范围`100~999`)，请求会直接根据设置的状态码返回，不会请求到线上，这个与[replaceStatus](replaceStatus.html)不同，后者是请求返回后再修改状态码，可以用于模拟各种状态码，配置方式：

	pattern statusCode://code

其中：code >= 100 && code <= 999，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。


例子：

	www.ifeng.com statusCode://500
