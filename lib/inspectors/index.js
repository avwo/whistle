module.exports = ['./https',
				  './rules', 
				  './head',
				  './req', 
				  './data',
				  './res'].map(function(mod) {
                	  return require(mod);
                  });