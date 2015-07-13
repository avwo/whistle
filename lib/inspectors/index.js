module.exports = ['./https',
				  './rules', 
				  './weinre',
				  './head',
				  './req', 
				  './data', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });