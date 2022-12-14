#!/bin/sh

# We can expect the following environment variables:
#
#   GITHUB_WORKDIR          - Root of where all rleases are unpacked
#   DEPLOYMENT_TARGET_DIR   - Root of the FSX filesystem where project files can be copied
#   INTERNAL_APP_DOMAIN     - Internal Application domain, for example "example.tld"
#   INTERNAL_APP_PORT       - TCP Port for the Listener of this domain, for example "8443"
#

PRIVATE_BASE="${DEPLOYMENT_TARGET_DIR}/intranet-static"
echo "PRIVATE_BASE=${PRIVATE_BASE}"
if [ -d ${PRIVATE_BASE} ] 
then
    logger -- "${PRIVATE_BASE} ready";
else
    logger -- "${PRIVATE_BASE} not ready";
    exit 1;
fi

rm -vfrR $PRIVATE_BASE/*
cp -vfrR ./* $PRIVATE_BASE/
rm -vf $PRIVATE_BASE/deployment.sh

echo "Directory Listeing of ${PRIVATE_BASE}"
ls -lahrt $PRIVATE_BASE/*

logger -- "Copied private static files"

L=`find /data -exec ls -lahrt {} \;`
logger -- $L
