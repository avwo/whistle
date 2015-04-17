module.exports = ['./https',
                  './data',
				  './rules', 
				  './dump',
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });