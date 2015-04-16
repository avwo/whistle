module.exports = ['./https',
                  './data',
                  './dump', 
				  './rules', 
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });