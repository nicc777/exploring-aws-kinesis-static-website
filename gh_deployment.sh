#!/bin/sh

BRANCH=`git rev-parse --abbrev-ref HEAD`
BRANCH="${BRANCH%
}"                # Remove a trailing newline.

echo "BRANCH >>${BRANCH}<<";

NOW=`date +%Y%m%d%H%M`
VERSION=`cat VERSION`

RELEASE_VERSION="${VERSION}-DAILY${NOW}"

echo "Release: ${RELEASE_VERSION}"

echo $RELEASE_VERSION > private-website/release_version.txt

git add .
git commit -m "Release commit for release ${RELEASE_VERSION}"
git push origin $BRANCH

gh release create r$RELEASE_VERSION --notes "Release ${RELEASE_VERSION}"

