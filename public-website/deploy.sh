#!/bin/sh

# We can expect the following environment variables:
#
#   GITHUB_WORKDIR          - Root of where all rleases are unpacked
#   DEPLOYMENT_TARGET_DIR   - Root of the FSX filesystem where project files can be copied
#

PUBLIC_BASE="${DEPLOYMENT_TARGET_DIR}/www-static"
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

logger "Copied public static files"
