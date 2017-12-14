values.test = {'x-test': render('<%=test%>', {test: reqScriptData.test})};
rules.push(headers.host + ' resHeaders://{test}');
