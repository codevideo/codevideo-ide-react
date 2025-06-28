#!/bin/bash

# for local usage on chris's computer

# first, bump patch version in package.json
# npm version patch &&

# then, build the project
npm run build &&

# publish to npm
npm publish --access public &&

# wait for 15 seconds for npm to finish publishing internally (HTTP cache nonsense)
sleep 15 &&

# then, move into examples directory
cd example &&

# ensure we are using node v20
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" &&
nvm use 20 &&

# clear the npm cache
npm cache clean --force &&

# then, run the rebuild script
npm run rebuild &&

# remove the public folder in the codevideo-cli
rm -rf /Users/chris/enterprise/codevideo/codevideo-cli/cli/staticserver/public &&

# then, copy in the public folder from the build here
cp -r /Users/chris/enterprise/codevideo/codevideo-ide-react/example/public /Users/chris/enterprise/codevideo/codevideo-cli/cli/staticserver/public &&

# build the codevideo-cli tool with the named binary
cd /Users/chris/enterprise/codevideo/codevideo-cli &&
go build -o codevideo &&

# then, run the example and open the video when done
./codevideo --verbose --open --debug -p "$(cat data/lesson.json)" > /Users/chris/enterprise/codevideo/codevideo-cli/test-lesson-2.log &&

# return us back to the root of this project
cd /Users/chris/enterprise/codevideo/codevideo-ide-react &&

echo "Full build done."