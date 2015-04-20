module.exports = ['./https',
                  './data',
				  './rules', 
				  './dump',
				  './head',
				  './req', 
				  './res'].map(function(mod) {
                	  return require(mod);
                  });