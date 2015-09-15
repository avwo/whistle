var net = require('net');
var fs = require('fs');
var http = require('http');
var path = require('path');
var rules = require('./index');
var util = require('../util');
var config = require('../../package.json');
var Storage = require('./storage');
var ROOT = util.LOCAL_DATA_PATH;
var rulesStorage = new Storage(path.join(ROOT, 'rules'));
var valuesStorage = new Storage(path.join(ROOT, 'values'));
var propertiesStorage = new Storage(path.join(ROOT, 'properties'));
var system = require('./system');
var oldData = require('./old-data');
var filter;

function setFilter(text) {
	if (!text || typeof text != 'string') {
		text = '';
	}
	text = text.substring(0, 128);
	propertiesStorage.setProperty('filterText', text);
	filter = util.toRegExp(text) || text;
}

exports.setFilter = setFilter;

setFilter(propertiesStorage.getProperty('filterText'));

exports.filterUrl = function filterUrl(url) {
	if (!url) {
		return false;
	}
	if (!filter) {
		return true;
	}
	if (filter.test) {
		return filter.test(url);
	}
	return url.indexOf(filter) != -1;
};

function syncData() {
	if (!oldData.exists || propertiesStorage.getProperty('_syncDataEnd')) {
		return;
	}
	
	var defalutRules = oldData.getDefaultRules();
	setDefaultRules(defalutRules.value);
	defalutRules.selected && enableDefaultRules();
	oldData.getRulesList().forEach(function(data) {
		addRulesFile(data.name, data.value);
		data.selected && selectRulesFile(data.name);
	});
	
	oldData.getRulesList().forEach(function(data) {
		addRulesFile(data.name, data.value);
		data.selected && selectRulesFile(data.name);
	});
	
	oldData.getRulesList().forEach(function(data) {
		addRulesFile(data.name, data.value);
		data.selected && selectRulesFile(data.name);
	});
	
	oldData.getValuesList().forEach(function(data) {
		addValuesFile(data.name, data.value);
	});
	
	var rulesStyle = oldData.getRulesStyle();
	var valuesStyle = oldData.getValuesStyle();
	
	propertiesStorage.setProperty('theme', rulesStyle.fontSize);
	propertiesStorage.setProperty('fontSize', rulesStyle.fontSize);
	propertiesStorage.setProperty('showLineNumbers', rulesStyle.fontSize);
	
	propertiesStorage.setProperty('valuesTheme', valuesStyle.fontSize);
	propertiesStorage.setProperty('valuesFontSize', valuesStyle.fontSize);
	propertiesStorage.setProperty('valuesShowLineNumbers', valuesStyle.fontSize);
	
	propertiesStorage.setProperty('_syncDataEnd', true);
	oldData.drop();
}

process.nextTick(function() {
	syncData();
	parseRules();
});
/**
 * rules
 */

function parseHosts(text) {
	if (typeof text != 'string' 
		|| !(text = text.trim())) {
		return '';
	}
	var result = [];
	text.split(/\n|\r\n|\r/g)
		.forEach(function(line) {
			var raw = line;
			line = line.replace(/#.*$/, '').trim();
			if (!line) {
				return;
			}
			line = line.split(/\s+/);
			var pattern = line[0];
			if (net.isIP(pattern)) {
				line.slice(1).forEach(function(matcher) {
					!/\//.test(matcher) && result.push(pattern + ' ' + matcher);
				});
			} else if (!/\//.test(pattern) && line[1] && net.isIP(line[1])) {
				result.push(line[1] + ' ' + pattern);
			} 
		});
	
	return result.join('\r\n');
}

function parseRules(defaultRules) {
	var value = [];
	var hosts =  propertiesStorage.getProperty('syncWithSysHosts') ? [] : null;
	getAllRulesFile().forEach(function(file) {
		if (file.selected) {
			value.push(file.data);
			if (hosts) {
				var sysHosts = parseHosts(file.data); 
				if (sysHosts) {
					hosts.push('#\r\n# ' + file.name + '\r\n#' + '\r\n' + sysHosts);
				}
			}
		}
	});
	
	if (typeof defaultRules == 'string') {
		setDefaultRules(defaultRules);
		value.push(defaultRules);
		rulesStorage.setProperty('disabledDefalutRules', false);
	}else if (!defaultRulesIsDisabled()) {
		defaultRules = getDefaultRules();
		value.push(defaultRules);
	}
	
	if (hosts && defaultRules) {
		var sysHosts = parseHosts(defaultRules); 
		if (sysHosts) {
			hosts.push('#\r\n# Default\r\n#' + '\r\n' + sysHosts);
		}
	}
	
	rules.parse(value.join('\r\n'));
	if (hosts) {
		hosts = hosts.join('\r\n\r\n');
		system.setHosts(hosts, util.noop);
	}
}

exports.parseRules = parseRules;

function setDefaultRules(data) {
	data = typeof data != 'string' ? '' : data;
	rulesStorage.setProperty('defalutRules', data);
	parseRules();
}

function getDefaultRules() {
	return rulesStorage.getProperty('defalutRules');
}

function disableDefaultRules() {
	rulesStorage.setProperty('disabledDefalutRules', true);
	parseRules();
}

function enableDefaultRules() {
	rulesStorage.setProperty('disabledDefalutRules', false);
	parseRules();
}

function defaultRulesIsDisabled() {
	return rulesStorage.getProperty('disabledDefalutRules');
}

function selectRulesFile(file) {
	if (!rulesStorage.existsFile(file)) {
		return;
	}
	
	var selectedList = allowMultipleChoice() ? getSelectedRulesList() : [];
	if (selectedList.indexOf(file) == -1) {
		selectedList.push(file);
		rulesStorage.setProperty('selectedList', selectedList);
	}
	parseRules();
	return selectedList;
}

function unselectRulesFile(file) {
	var selectedList;
	
	if (allowMultipleChoice()) {
		selectedList = getSelectedRulesList();
		var index = selectedList.indexOf(file);
		if (index != -1) {
			selectedList.splice(index, 1);
			rulesStorage.setProperty('selectedList', selectedList);
		}
	} else {
		selectedList = [];
		rulesStorage.setProperty('selectedList', selectedList);
	}
	parseRules();
	
	return selectedList;
}

function allowMultipleChoice() {
	return propertiesStorage.getProperty('allowMultipleChoice');
}

function clearSelection() {
	rulesStorage.setProperty('selectedList', []);
	parseRules();
}

function getSelectedRulesList() {
	var selectedList = rulesStorage.getProperty('selectedList');
	if (!selectedList) {
		selectedList = [];
		rulesStorage.setProperty('selectedList', selectedList);
	}
	return selectedList;
}

function removeRulesFile(file) {
	unselectRulesFile(file);
	rulesStorage.removeFile(file);
}

function renameRulesFile(file, newFile) {
	if (!rulesStorage.renameFile(file, newFile)) {
		return;
	}
	
	var selectedList = getSelectedRulesList();
	var index = selectedList.indexOf(file);
	if (index != -1) {
		selectedList[index] = newFile;
		rulesStorage.setProperty('selectedList', selectedList);
	}
}

function addRulesFile(file, data) {
	rulesStorage.writeFile(file, data);
}

function getAllRulesFile() {
	var list = rulesStorage.getFileList();
	var selectedList = getSelectedRulesList();
	list.forEach(function(file) {
		file.selected = selectedList.indexOf(file.name) != -1;
	});
	return list;
}

exports.rules = {
		getSysHosts: system.getHosts,
		setSysHosts: system.setHosts,
		remove: removeRulesFile,
		add: addRulesFile,
		rename: renameRulesFile,
		select: selectRulesFile,
		unselect: unselectRulesFile,
		list: getAllRulesFile,
		getDefault: getDefaultRules,
		setDefault: setDefaultRules,
		enableDefault: enableDefaultRules,
		disableDefault: disableDefaultRules,
		defaultRulesIsDisabled: defaultRulesIsDisabled,
		parseRules: parseRules,
		clearSelection:clearSelection,
		getSelectedList: getSelectedRulesList
};


/**
 * values
 */

function addValuesFile(file, data) {
	valuesStorage.writeFile(file, data);
}

exports.values = {
	add: addValuesFile,
	get: function(file) {
		return valuesStorage.readFile(file);
	},
	remove: function remove(file) {
		valuesStorage.removeFile(file);
	},
	rename: function(file, newFile) {
		valuesStorage.renameFile(file, newFile);
	},
	list: function list() {
		var selectedFile = valuesStorage.getProperty('selectedFile');
		var list = valuesStorage.getFileList();
		if (selectedFile) {
			list.forEach(function(file) {
				file.selected = file.name == selectedFile;
			});
		}
		return list;
	},
	select: function(file) {
		typeof file == 'string' && valuesStorage.setProperty('selectedFile', file);
	},
	unselect: function() {
		valuesStorage.removeProperty('selectedFile');
	}
};



setTimeout(function getWhistleVersion() {
	http.get(config.registry, function(res) {
		res.setEncoding('utf8');
		var body = '';
		res.on('data', function(data) {
			body += data;
		});
		
		res.on('error', util.noop);
		res.on('end', function() {
			var ver = util.parseJSON(body);
			ver = ver['dist-tags'];
			if (ver = ver && ver['latest']) {
				propertiesStorage.setProperty('latestVersion', ver);
			}
		});
		setTimeout(getWhistleVersion, 1000 * 60 * 60 * 12);
	}).on('error', util.noop);
}, 1000); //等待package的信息配置更新完成

/**
 * properties
 */

exports.properties = {
		set: function(name, value) {
			typeof name == 'string' ? propertiesStorage.setProperty(name, value) :  
				propertiesStorage.setProperties(name);
		},
		remove: function(name) {
			propertiesStorage.removeProperty(name);
		},
		get: function(name) {
			return propertiesStorage.getProperty(name);
		}
};





