'use strict';

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const startCase = require('lodash.startcase');
const config = require('./config');

const langs = config.langs;
const docConfig = require('../src/config.json');
const srcDir = path.join(__dirname, '../src');
const watchMode = process.argv[2] === '-w';

let cache = {};

build();
if (watchMode) {
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (filename.indexOf('/_book') >= 0) {
      return;
    }
    const ignores = langs.reduce((result, lang) => {
      result.push(`${lang}/README.md`);
      result.push(`${lang}/SUMMARY.md`);
      return result;
    }, []);

    const isTarget = langs.some(lang => {
      return filename.startsWith(lang) && ignores.indexOf(filename) < 0;
    });
    const isConfigFile = filename === 'config.json';
    if (isConfigFile) {
      console.log('Please restart the docs:watch cmd !');
      return;
    }
    if (isTarget) {
      console.log(`file: ${filename} type: ${eventType}`);
      build();
    }
  });

  langs.forEach((lang) => {
    console.info(`***** start watching ${srcDir}/${lang}/*.md *****`);
  });
}

function getFilename({ lang, parentPaths, slug, isDir }) {
  let filename = '';
  if (isDir) {
    filename = path.join(srcDir, lang, parentPaths.join('/'), isDir ? slug : '', 'README.md');
    if (fs.existsSync(filename)) {
      return filename;
    }
  }
  filename = path.join(srcDir, lang, parentPaths.join('/'), `${slug}.md`);
  if (fs.existsSync(filename)) {
    return filename;
  }
  return '';
}

function getFileId(arr) {
  return arr.join('_');
}

function generateNavTitle({ parentPaths, item, sign, lang }) {
  const isDir = typeof item === 'object' && item.catalog && item.catalog.length;
  const slug = typeof item === 'string' ? item : typeof item === 'object' ? item.name : '';
  const sign_ = sign || '*';

  if (!slug) {
    return null;
  }

  const filename = getFilename({
    lang, parentPaths, slug, isDir
  });
  const anchor = filename ? getFileId(parentPaths.concat(slug)) : '';
  const prefix = parentPaths.reduce((pre, next) => {
    return pre += '\t';
  }, '');
  const title = typeof item === 'string' ? prettyCatalog(item) : item.i18n ?
    item.i18n[lang] || item.i18n['en-us'] || prettyCatalog(item.name) : prettyCatalog(item.name);

  return `${prefix}${sign_} [${title}](README.md#${anchor})`;
}

function replaceAnchor(content, anchor) {
  return content.replace(/(\#+.*)/, (match, p1) => {
    return `${p1} {#${anchor}}`;
  });
}

function walk({ catalog, lang, result, parentPaths, nodeFn }) {
  if (!catalog || !catalog.length) {
    return result;
  }
  return catalog.reduce((result, item) => {
    const slug = typeof item === 'string' ? item : typeof item === 'object' ? item.name : '';
    if (slug) {
      const isDir = item.catalog && item.catalog.length;
      nodeFn({ parentPaths, lang, item, isDir, result });

      if (isDir) {
        parentPaths.push(slug);
        result = walk({ catalog: item.catalog, lang, result, parentPaths, nodeFn });
        parentPaths.pop();
      }
    }
    return result;
  }, result);
}

function sammary() {
  const nodeFn = function ({ parentPaths, lang, item, isDir, result }) {
    const navTitle = generateNavTitle({ parentPaths, item, sign: isDir ? '-' : '*', lang });
    result.push(navTitle);
  };

  langs.forEach(dir => {
    const SUMMARY = 'SUMMARY.md';
    const targetFile = path.join(srcDir, `${dir}/${SUMMARY}`);

    const result = walk({
      catalog: docConfig.catalog,
      lang: dir,
      result: [],
      parentPaths: [],
      nodeFn
    });

    if (result && result.length) {
      result.unshift('# whistle\n');
      fs.writeFileSync(targetFile, result.join('\n'));
    }
  });
}

function combo() {
  const nodeFn = function ({ parentPaths, lang, item, result }) {
    const isDir = typeof item === 'object' && item.catalog && item.catalog.length;    
    const slug = typeof item === 'string' ? item : typeof item === 'object' ? item.name : '';
    const filename = getFilename({
      parentPaths, lang, slug, isDir
    });
    const fileId = getFileId(parentPaths.concat(slug));

    if (filename) {
      let content = fs.readFileSync(filename).toString();
      content = replaceAnchor(content, fileId);
      cache[fileId] = content;
      result.push(fileId);
    }
  };

  langs.forEach(dir => {
    const README = 'README.md';
    const targetFile = path.join(srcDir, `${dir}/${README}`);

    const result = walk({
      catalog: docConfig.catalog,
      lang: dir,
      result: [],
      parentPaths: [],
      nodeFn
    });
    if (result && result.length) {
      const content = result.reduce((pre, next) => {
        if (cache[next]) {
          pre += cache[next] + '\n';
        }
        return pre;
      }, '');
      fs.writeFileSync(targetFile, content);
    }
  });
}

function build() {
  sammary();
  cache = {};
  combo();
}
function isChinese(string) {
  var req = /[\u4E00-\u9FA5]|[\uFE30-\uFFA0]/gi;
  if (!req.exec(string)) {
    return false;
  } else {
    return true;
  }
}

function isNonAscii(string) {
  var regExp = /^[ -~\t\n\r]+$/gi;
  return !regExp.test(string);
}

function prettyCatalog(fileName) {
  if (isChinese(fileName) || isNonAscii(fileName)) {
    return fileName;
  }
  return startCase(fileName);
}
