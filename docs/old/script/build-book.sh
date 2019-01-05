#!/bin/bash
DIR=''
WHISTLE_ROOT=''
BOOK_DIR=''

# https://stackoverflow.com/questions/59895/getting-the-source-directory-of-a-bash-script-from-within
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR
WHISTLE_ROOT="$(git rev-parse --show-toplevel)"
BOOK_DIR="$WHISTLE_ROOT/docs/zh"
cd $WHISTLE_ROOT

echo "working on $PWD"


# install gitbook
if hash gitbook 2>/dev/null; then
  echo 'gitbook has been installed.'
else
  echo 'installing gitbook: npm i -g -c gitbook-cli'
  npm i -g -c gitbook-cli
fi

git clean -df
git checkout master
git pull origin master

# docs_changed_cnt=$(git --no-pager diff --name-only FETCH_HEAD $(git merge-base FETCH_HEAD master) | grep "$BOOK_DIR" |wc -l)

# gitbook build
echo "building book: gitbook build $BOOK_DIR"
gitbook build "$BOOK_DIR" "$BOOK_DIR/_book"

git branch -D gh-pages
git checkout --orphan gh-pages
git rm --cached -r .
git clean -df
rm -rf *~
echo "*~" > .gitignore
echo "_book" >> .gitignore
echo "node_modules" >> .gitignore
git add .gitignore
git commit -m "feat: ignore some files"
cp -r $BOOK_DIR/_book/* .
git add .
git commit -m "feat: publish book"
git push -u origin gh-pages --force-with-lease
git checkout master

echo 'Done! 💦'
