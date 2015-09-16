module.exports = ['./https',
				  './rules', 
				  './weinre',
				  './log',
				  './head',
				  './req', 
				  './data', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });