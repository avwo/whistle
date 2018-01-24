'use strict';

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const config = require('./config');

const langs = config.langs;

function correct(root) {
  const rootPath = path.join(__dirname, '../src/', root);

  glob('**/*.md', {
    root: rootPath,
    cwd: rootPath,
    ignore: ['_book/*/**', 'README.md', 'SUMMARY.md']
  }, (er, files) => {
    if(er){
      return;
    }
    files.forEach(file => {
      const fullFile = path.join(rootPath, file);
      let content = fs.readFileSync(fullFile).toString();
      
      content = content.replace(/(\[[^\[\]]+\])\(([^\)]+\.html)\)/g, (match, p1, p2) =>{
        if(/https?:\/\/.*$/.test(p2)){
          return match;
        }
        let targetFile = path.join(path.dirname(fullFile), p2);
        const basename = path.posix.basename(targetFile, '.html');
        targetFile = path.join(path.dirname(targetFile), basename);
        let fileId = getFileId(rootPath, targetFile);

        if(fileId){
          fileId = fileId.replace(/_readme/i, '');
          return `${p1}(#${fileId})`;
        }
        return match;
      });
      fs.writeFileSync(fullFile, content);
    });
  });
}

function getFileId(absRoot, absFilename){
  if(absFilename.indexOf(absRoot) === 0){
    return absFilename.substring(absRoot.length + 1, absFilename.length).replace(new RegExp(path.sep, 'g'), '_');
  }
  return '';
}

langs.forEach(lang => {
  correct(lang);
});
