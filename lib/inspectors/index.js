module.exports = ['./https',
				  './rules', 
				  './head',
				  './req', 
				  './data',
				  './res',
				  './proxy'].map(function(mod) {
                	  return require(mod);
                  });