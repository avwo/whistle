module.exports = ['./https',
                  './data',
				  './rules', 
				  './head',
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });