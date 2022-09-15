#!/bin/sh

# We can expect the following environment variables:
#
#   GITHUB_WORKDIR          - Root of where all rleases are unpacked
#   DEPLOYMENT_TARGET_DIR   - Root of the FSX filesystem where project files can be copied
#

PRIVATE_BASE="${DEPLOYMENT_TARGET_DIR}/intranet-static"
if [ -d ${PRIVATE_BASE} ] 
then
    logger "${PRIVATE_BASE} ready";
else
    logger "${PRIVATE_BASE} not ready";
    exit 1;
fi

rm -vfrR $PRIVATE_BASE/*
cp -vfrR ./* $PRIVATE_BASE/

logger "Copied private static files"
