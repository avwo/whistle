module.exports = ['./https',
                  './dump', 
				  './rules', 
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });