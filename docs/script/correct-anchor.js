'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function ({ rootPath, absFilename, content }) {
  let result = content || fs.readFileSync(absFilename).toString();
  result = result.replace(/(\[[^\[\]]+\])\(([^\)]+\.(html|md))\)/g, (match, p1, p2) => {
    if (/https?:\/\/.*$/.test(p2)) {
      return match;
    }
    let targetFile = path.join(path.dirname(absFilename), p2.replace(/\.(html|md)/, ''));
    const basename = path.posix.basename(targetFile);
    targetFile = path.join(path.dirname(targetFile), basename);
    let fileId = getFileId(rootPath, targetFile);

    if (fileId) {
      fileId = fileId.replace(/_readme/i, '');
      return `${p1}(#${fileId})`;
    }
    return match;
  });
  return result;
};

function getFileId(absRoot, absFilename) {
  if (absFilename.indexOf(absRoot) === 0) {
    return absFilename.substring(absRoot.length + 1, absFilename.length).replace(new RegExp(path.sep, 'g'), '_');
  }
  return '';
}
