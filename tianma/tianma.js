var tianma = require('tianma');
var unicorn = require('tianma-unicorn');
var pipe = tianma.pipe;
var readFile = require('./file-reader');
var config = require('../package.json');
var root;

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
	
module.exports = function init(options) {
tianma
	.createHost({ port: options.tianmaport, portssl: options.tianmasslport})
		.mount('*.*', [function(context, next) {//独角兽没有把headers传递过去，比较坑，不得已而为之
			if (root = context.request.head(config.tianmaRoot)) {
				root = decodeURIComponent(root);
			}
			next();
		},unicorn({ source: 'loop://localhost/'})])
		.mount('/', [readFile(function() {
			return root;
		}), accessControlHandler])
		.start();
};