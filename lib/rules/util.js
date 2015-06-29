var MAX_LENGTH = 32;
var fs = require('fs');
var path = require('path');
var rules = require('./index');
var util = require('../../util');
var ROOT = util.LOCAL_DATA_PATH;
var HOSTS = path.join(ROOT, 'hosts');
var PUBLIC_HOSTS = path.join(HOSTS, 'hosts');
var META_PATH = path.join(HOSTS, 'meta');
var LIST_PATH = path.join(HOSTS, 'list');
var VALUES = path.join(ROOT, 'values');
var REGISTER = path.join(ROOT, 'register');
var encoding = {encoding: 'utf8'};
var curHostsText = '';
var publicHostsText = readFile(PUBLIC_HOSTS);
var hostsData = {};
var values = util.parseJSON(readFile(VALUES)) || {};
var register = util.parseJSON(readFile(REGISTER)) || {};
var metaData = util.parseJSON(readFile(META_PATH)) || {};

util.mkdir(ROOT);
util.mkdir(HOSTS);
util.mkdir(LIST_PATH);

if (metaData._currentHostsName) {
	curHostsText = readFile(path.join(LIST_PATH, metaData._currentHostsName));
}

var hostsList = metaData._hostsList;

if (!hostsList || !hostsList.length) {
	try {
		hostsList = metaData._hostsList = fs.readdirSync(LIST_PATH);
	} catch(e) {}
	if (!hostsList) {
		hostsList = metaData._hostsList = [];
	}
}


for (var i = 0, len = hostsList.length; i < len; i++) {
	var filename = hostsList[i];
	hostsData[filename] = readFile(path.join(LIST_PATH, filename));
}

function noop() {}

function readFile(filepath) {
	try {
		return fs.readFileSync(filepath, encoding);
	} catch(e) {}
	
	return '';
}

function setProperty(name, value) {
	metaData[name] = value;
	fs.writeFile(META_PATH, JSON.stringify(metaData), noop);
} 

function getProperty(name) {
	return metaData[name];
}

function publicHostsIsDisabled() {
	return metaData._disablePublicHosts;
}

function getCurHostsName() {
	return metaData._currentHostsName;
}

function createHosts(name, text) {
	if (!(name = getName(name))) {
		return;
	}
	
	if (updateHostsList(name, text)) {
		fs.writeFile(path.join(LIST_PATH, name), text || '', noop);
	}
}

function setHosts(name, text) {
	if (!(name = getName(name))) {
		return;
	}
	
	curHostsText = text || '';
	parseHosts();
	setProperty('_currentHostsName', name);
	fs.writeFile(path.join(LIST_PATH, name), curHostsText, noop);
	updateHostsList(name, curHostsText);
} 

function parseHosts() {
	rules.parse(curHostsText + '\n' + (publicHostsIsDisabled() ? '' : publicHostsText));
}

function updateHostsList(name, text) {
	hostsData[name] = text;
	if (hostsList.indexOf(name) == -1) {
		hostsList.push(name);
		setProperty('_hostsList', hostsList);
		return true;
	}
	
	return false;
}

function getName(name) {
	if (!name) {
		return;
	}
	
	name = name.substring(0, MAX_LENGTH);
	if (hostsList.length > 36 && hostsList.indexOf(name) == -1) {
		return;
	}
	
	return name;
}

function removeHosts(name) {
	if (name) {
		var index = hostsList.indexOf(name);
		if (index > -1) {
			hostsList.splice(index, 1);
			fs.unlink(path.join(LIST_PATH, name), noop);
		}
		if (getCurHostsName() == name) {
			disableHosts();
		}
	}
}

function disableHosts() {
	curHostsText = '';
	parseHosts();
	setProperty('_currentHostsName');
}

module.exports = {
		dataPath: ROOT,
		setValue: function(key, value) {
			values[key] = value;
			fs.writeFile(VALUES, JSON.stringify(values), noop);
		},
		getValue: function(key) {
			return key ? values[key] : values;
		},
		removeValue: function(key) {
			delete values[key];
			fs.writeFile(VALUES, JSON.stringify(values), noop);
		},
		register: function(key, value) {
			if (arguments.length < 2) {
				return register[key];
			}
			register[key] = value;
			fs.writeFile(REGISTER, JSON.stringify(register), noop);
		},
		unregister: function(key) {
			delete register[key];
			fs.writeFile(REGISTER, JSON.stringify(register), noop);
		},
		maxLength: MAX_LENGTH,
		setProperty: setProperty,
		getProperty: getProperty,
		getPublicHosts: function() {
			return publicHostsText;
		},
		setPublicHosts: function(hosts) {
			publicHostsText = hosts || '';
			parseHosts();
			fs.writeFile(PUBLIC_HOSTS, publicHostsText, noop);
		},
		disablePublicHosts: function() {
			setProperty('_disablePublicHosts', true);
			parseHosts();
		},
		enablePublicHosts: function() {
			setProperty('_disablePublicHosts', false);
			parseHosts();
		},
		disableHosts: disableHosts,
		loadHosts: parseHosts,
		createHosts: createHosts,
		removeHosts: removeHosts,
		setHosts: setHosts,
		getHostsData: function() {
			
			return {
				publicHosts: publicHostsText,
				curHostsName: getCurHostsName(),
				hostsList: hostsList,
				hostsData: hostsData,
				disabled: publicHostsIsDisabled()
			};
		}
};