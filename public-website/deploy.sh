#!/bin/sh

# We can expect the following environment variables:
#
#   GITHUB_WORKDIR          - Root of where all rleases are unpacked
#   DEPLOYMENT_TARGET_DIR   - Root of the FSX filesystem where project files can be copied
#

PUBLIC_BASE="${DEPLOYMENT_TARGET_DIR}/www-static"
echo "PUBLIC_BASE=${PUBLIC_BASE}"
if [ -d ${PUBLIC_BASE} ] 
then
    logger "${PUBLIC_BASE} ready";
else
    logger "${PUBLIC_BASE} not ready";
    exit 1;
fi

rm -vfrR $PUBLIC_BASE/*
cp -vfrR ./* $PUBLIC_BASE/
rm -vf $PUBLIC_BASE/deployment.sh

echo "Directory Listeing of ${PUBLIC_BASE/}"
ls -lahrt $PUBLIC_BASE/*

logger "Copied public static files"
