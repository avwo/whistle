CodeMirror.defineMode("whistle", function() {
			
			function isIP(str) {
				return /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/.test(str);
			}
			
			function isHead(str) {
				return /^head:\/\//.test(str);
			}
			
			function isWeinre(str) {
				return /^weinre:\/\//.test(str);
			}
			
			function isProxy(str) {
				return /^proxy:\/\//.test(str);
			}
			
			function isReq(str) {
				return /^req:\/\//.test(str);
			}
			
			function isRes(str) {
				return /^res:\/\//.test(str);
			}
			
			function isUrl(str) {
				return /^https?:\/\//i.test(str);
			}
			
			function isRule(str) {
				return /^[a-z0-9.+-]+:\/\//i.test(str);
			}
			
			function isRegExp(str) {
				
				return /^\/(.+)\/(i)?$/.test(str);
			}
			
			return {
				 token: function(stream, state) {
					 if (stream.eatSpace()) {
					     return null;
					   }
					 
					 var ch = stream.next();
					 if (ch == '#') {
						 stream.eatWhile(function(ch) {
							 return true;
						 });
						 return 'comment';
					 }
					
					 var str = ch;
					 var pre, type;
					 stream.eatWhile(function(ch) {
						if (/\s/.test(ch) || ch == '#') {
							return false;
						}
						
						str += ch;
						if (!type && ch == '/' && pre == '/') {
							if (isHead(str)) {
								 type = 'header';
							 } else if (isWeinre(str)) {
								 type = 'atom';
							 } else if (isProxy(str)) {
								 type = 'tag';
							 } else if (isReq(str)) {
								 type = 'negative';
							 } else if (isRes(str)) {
								 type = 'positive';
							 } else if (isUrl(str)) {
								 type = 'link';
							 } else if (isRule(str)) {
								 type = 'builtin';
							 }
						}
						pre = ch;
						return true;
					 });
					
					 if (type) {
						 return type;
					 }
					 
					 if (isIP(str)) {
						 return 'number';
					 }
					 
					 if (isRegExp(str)) {
						 return 'attribute';
					 }
					 
					 return null;
				 }
			};
});

CodeMirror.defineMIME("text/whistle", "whistle");