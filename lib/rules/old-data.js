var fs = require('fs');
var fe = require('fs-extra');
var path = require('path');
var util = require('../util');
var ROOT = util.OLD_LOCAL_DATA_PATH;
var HOSTS = path.join(ROOT, 'hosts');
var LIST_PATH = path.join(HOSTS, 'list');
var values = util.parseJSON(readFileSync(path.join(ROOT, 'values'))) || {};
var register = util.parseJSON(readFileSync(path.join(ROOT, 'register'))) || {};
var metaData = util.parseJSON(readFileSync(path.join(HOSTS, 'meta'))) || {};

function getRootCA() {
	return readFileSync(path.join(ROOT, 'certs/root.crt'));
}

function getRootCAKey() {
	return readFileSync(path.join(ROOT, 'certs/root.key'));
}

function getDefaultRules() {
	
	return {
		name: 'Default',
		value: readFileSync(path.join(HOSTS, 'hosts')) || '',
		selecled: !metaData._disablePublicHosts
	}
}

function getRulesList() {
	var curName = metaData._currentHostsName;
	var fileList = metaData._hostsList || [];
	var list = [];
	try {
		fs.readdirSync(LIST_PATH).forEach(function(file) {
			if (fileList.indexOf(file) == -1) {
				fileList.push(file);
			}
		});
		fileList.forEach(function(file) {
			list.push({
				name: file,
				value: readFileSync(path.join(LIST_PATH, file)),
				selected: curName === file
			});
		});
	} catch(e) {}
	return list;
}

function getRulesStyle() {
	
	return {
		theme: register.theme,
		fontSize: register.fontSize,
		showLineNumbers: register.showLineNumbers
	};
}

function getValuesList() {
	var list = [];
	Object.keys(values).forEach(function(name) {
		list.push({
			name: name,
			value: values[name] || ''
		});
	});
	return list;
}

function getValuesStyle() {
	return {
		theme: register.valuesTheme,
		fontSize: register.valuesFontSize,
		showLineNumbers: register.valuesShowLineNumbers
	};
}

function readFileSync(path) {
	try {
		return fs.readFileSync(path, {encoding: 'utf8'});
	} catch(e) {}
}

module.exports = {
		exists: fs.existsSync(ROOT),
		getRootCA: getRootCA,
		getRootCAKey: getRootCAKey,
		getDefaultRules: getDefaultRules,
		getRulesList: getRulesList,
		getRulesStyle: getRulesStyle,
		getValuesList: getValuesList,
		getValuesStyle:getValuesStyle,
		drop: function() {
			fe.removeSync(ROOT);
		}
};
