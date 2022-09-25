#!/bin/sh

NOW=`date +%Y%m%d%H%M`
VERSION=`cat VERSION`

RELEASE_VERSION="${VERSION}-DAILY${NOW}"

echo "Release: ${RELEASE_VERSION}"

gh release create r$RELEASE_VERSION --notes "Release ${RELEASE_VERSION}"

