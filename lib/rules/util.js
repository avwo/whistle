var path = require('path');
var rules = require('./index');
var util = require('../util');
var Storage = require('./storage');
var ROOT = util.LOCAL_DATA_PATH;
var rulesStorage = new Storage(path.join(ROOT, 'rules'));
var valuesStorage = new Storage(path.join(ROOT, 'values'));
var propertiesStorage = new Storage(path.join(ROOT, 'properties'));

process.nextTick(parseRules);
/**
 * rules
 */
function parseRules(defaultRules) {
	var value = [];
	getAllRulesFile().forEach(function(file) {
		if (file.selected) {
			value.push(file.data);
		}
	});
	
	if (typeof defaultRules == 'string') {
		setDefaultRules(defaultRules);
		value.push(defaultRules);
		rulesStorage.setProperty('disabledDefalutRules', false);
	}else if (!defaultRulesIsDisabled()) {
		value.push(getDefaultRules());
	}
	
	rules.parse(value.join('\r\n'));
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
	var selectedList = getSelectedRulesList();
	if (selectedList.indexOf(file) == -1) {
		selectedList.push(file);
		rulesStorage.setProperty('selectedList', selectedList);
	}
	parseRules();
	return selectedList;
}

function unselectRulesFile(file) {
	var selectedList = getSelectedRulesList();
	var index = selectedList.indexOf(file);
	if (index != -1) {
		selectedList.splice(index, 1);
		rulesStorage.setProperty('selectedList', selectedList);
	}
	parseRules();
	
	return selectedList;
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

exports.values = {
	add: function add(file, data) {
		valuesStorage.writeFile(file, data);
	},
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





