'use strict';

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const targetFile = path.join(__dirname, '../README.md');

const filenamePattern = /^([\d\.]+)_.*$/;

function combo() {
  if (fs.existsSync(targetFile)) {
    fs.unlinkSync(targetFile);
  }
  const files = fs.readdirSync(srcDir);
  if (!files || !files.length) {
    return;
  }

  const result = files.reduce((result, file) => {
    if (filenamePattern.test(file)) {
      result.push(file);
    }
    return result;
  }, []);

  result.sort((pre,next) =>{
    const preIndex = (pre.match(filenamePattern) || [])[1] || 0;
    const nextIndex = (next.match(filenamePattern) || [])[1] || 0;
  
    return preIndex-nextIndex;
  });
  
  result.forEach(file => {
    const content = fs.readFileSync(path.join(srcDir, file));
    if (content) {
      fs.appendFileSync(targetFile, content);
      fs.appendFileSync(targetFile, '\n\n');
    }
  });

}

const watchMode = process.argv[2] === '-w';
if (watchMode) {
  fs.watch(srcDir, (eventType, filename) => {
    combo();
  });
  console.info(`***** watching ${srcDir}/*.md *****`);
}

combo();
