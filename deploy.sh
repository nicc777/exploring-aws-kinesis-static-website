#!/bin/sh

# We can expect the following environment variables:
#
#   GITHUB_WORKDIR          - Root of where all rleases are unpacked
#   DEPLOYMENT_TARGET_DIR   - Root of the FSX filesystem where project files can be copied
#   INTERNAL_APP_DOMAIN     - Internal Application domain, for example "example.tld"
#   INTERNAL_APP_PORT       - TCP Port for the Listener of this domain, for example "8443"
#

. /etc/environment

env > /data/logs/runnning_environment_main_deployment_script

check_dir () {
    DIR=$1
    if [ -d ${DIR} ] 
    then
        logger -- "${DIR} already exists"
    else
        mkdir -p $DIR
        logger -- "${DIR} created"
    fi
}



if [ -z ${DEPLOYMENT_TARGET_DIR+x} ]; 
then 
    logger -- "DEPLOYMENT_TARGET_DIR is unset"; 
    exit 1;
else 
    logger -- "DEPLOYMENT_TARGET_DIR is set to '$DEPLOYMENT_TARGET_DIR'"; 
    echo "DEPLOYMENT_TARGET_DIR is set to '$DEPLOYMENT_TARGET_DIR'"; 
fi

PRIVATE_BASE="${DEPLOYMENT_TARGET_DIR}/intranet-static"
PUBLIC_BASE="${DEPLOYMENT_TARGET_DIR}/www-static"
check_dir $PRIVATE_BASE
check_dir $PUBLIC_BASE

aws cloudformation list-exports --output json --region eu-central-1 > /tmp/cf-exports.json
cat /tmp/cf-exports.json | jq '.Exports[] | select(.Name=="Lab3EmployeeCognitoStack-CognitoEmployeeAuthorizerUserPoolId")' | jq '.Value' | awk -F\" '{print $2}' > /tmp/employee_userpool_id
cat /tmp/cf-exports.json | jq '.Exports[] | select(.Name=="Lab3EmployeeCognitoStack-CognitoEmployeeAuthorizerUserPoolClientId")' | jq '.Value' | awk -F\" '{print $2}' > /tmp/employee_client_id

CLIENT_ID=`cat /tmp/employee_client_id`
sed -i "s/__CLIENT_ID__/$CLIENT_ID/g" private-website/js/webapp.js

INTRANET_WEB_APP_BASE_URI="https://${INTERNAL_APP_DOMAIN}:${INTERNAL_APP_PORT}"
logger -- "INTRANET_WEB_APP_BASE_URI=${INTRANET_WEB_APP_BASE_URI}"
echo "INTRANET_WEB_APP_BASE_URI=${INTRANET_WEB_APP_BASE_URI}" > /data/logs/intranet_base_url
ESCAPED_REPLACE=$(printf '%s\n' "$INTRANET_WEB_APP_BASE_URI" | sed -e 's/[\/&]/\\&/g')
sed -i "s/__INTRANET_WEB_APP_BASE_URI__/$ESCAPED_REPLACE/g" private-website/js/webapp.js

echo "File private-website/js/webapp.js updated."
