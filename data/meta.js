var MAX_LENGTH = 32;
var fs = require('fs');
var path = require('path');
var hosts = require('../data/hosts');
var config = require('../util').config;
var ROOT = require('../util').LOCAL_DATA_PATH;
var HOSTS = path.join(ROOT, 'hosts');
var publicHosts = path.join(HOSTS, 'hosts');
var metaPath = path.join(HOSTS, 'meta');
var listPath = path.join(HOSTS, 'list');
var encoding = {encoding: 'utf8'};
var curHostsText = '';
var publicHostsText = readFile(publicHosts);
var metaData = {};
var hostsData = {};

mkdir(ROOT);
mkdir(HOSTS);
mkdir(listPath);

function mkdir(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}
}

try {
	metaData = JSON.parse(readFile(metaPath)) || {};
} catch(e) {}

if (metaData._currentHostsName) {
	curHostsText = readFile(path.join(listPath, metaData._currentHostsName));
}

var hostsList = metaData._hostsList || [];

for (var i = 0, len = hostsList.length; i < len; i++) {
	var filename = hostsList[i];
	hostsData[filename] = readFile(path.join(listPath, filename));
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
	fs.writeFile(metaPath, JSON.stringify(metaData), noop);
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
		fs.writeFile(path.join(listPath, name), text || '', noop);
	}
}

function setHosts(name, text) {
	if (!(name = getName(name))) {
		return;
	}
	
	curHostsText = text || '';
	parseHosts();
	setProperty('_currentHostsName', name);
	fs.writeFile(path.join(listPath, name), curHostsText, noop);
	updateHostsList(name, curHostsText);
} 

function parseHosts() {
	hosts.parse(curHostsText + '\n' + (publicHostsIsDisabled() ? '' : publicHostsText));
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
			fs.unlink(path.join(listPath, name), noop);
		}
	}
}

module.exports = {
		dataPath: ROOT,
		maxLength: MAX_LENGTH,
		setProperty: setProperty,
		getProperty: getProperty,
		getPublicHosts: function() {
			return publicHostsText;
		},
		setPublicHosts: function(hosts) {
			publicHostsText = hosts || '';
			parseHosts();
			fs.writeFile(publicHosts, publicHostsText, noop);
		},
		disablePublicHosts: function() {
			setProperty('_disablePublicHosts', true);
			parseHosts();
		},
		enablePublicHosts: function() {
			setProperty('_disablePublicHosts', false);
			parseHosts();
		},
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