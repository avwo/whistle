var tianma = require('tianma');
var unicorn = require('tianma-unicorn');
var pipe = tianma.pipe;
var readFile = require('./file-reader');
var debug = require('./debug');
var root, _debug;

function accessControlHandler(context, next) {
	var response = context.response;
	var mime = [
		'application/vnd.ms-fontobject',
		'application/x-font-ttf',
		'font/opentype',
		'application/x-font-woff',
		'application/font-woff'
	];

	if (mime.indexOf(response.head('content-type')) !== -1) {
		context.response.head('access-control-allow-origin', '*');
	}
	
	next();
}
	
tianma
	.createHost({ port: process.argv[2], portssl: process.argv[3]})
		.mount('*.*', [function(context, next) {//独角兽没有把headers传递过去，比较坑，不得已而为之，目前不支持同时指向两个目录，这种应用场景很少
			if (root = context.request.head('x-tianma-root')) {
				root = decodeURIComponent(root);
			}
			_debug = context.request.head('x-tianma-debug') == 'debug';
			
			next();
		}, unicorn({ source: 'loop://localhost/'}),
		(function (proxy) {
            return function (context, next) {
                context.response.head('access-control-allow-origin', '*');
                if (context.request.protocol === 'https:') {
                    proxy(context, next);
                } else {
                    next();
                }
            };
        }(pipe.proxy({
            'loop://localhost/$1': /\/\/.*?\/([sw]img\/.*)/,
            'http://img.alibaba.com@115.238.23.250/$1': /\/\/.*?\/(img\/(?:portrait|company)\/.*)/
        })))])
		.mount('/', [readFile(function() {
			return root;
		}), pipe.proxy({
            'http://style.alibaba.com@115.238.23.240/$1': /\/\/.*?\/(.*)/
        }), debug(function () {
        	return _debug;
        }), accessControlHandler])
		.start();
