module.exports = ['./https',
				  './rules', 
				  './weinre',
				  './head',
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });