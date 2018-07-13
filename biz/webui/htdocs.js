var path = require('path');
var ROOT = path.join(__dirname, 'htdocs');

function getHtmlFile(file) {
  return path.join(ROOT, file || '');
}

exports.getHtmlFile = getHtmlFile;

function getImgFile(file) {
  return path.join(ROOT, 'img', file || '');
}

exports.getImgFile = getImgFile;
