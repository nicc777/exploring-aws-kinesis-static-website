// Cognito Config (Public Domain)
var awsRegion = "eu-central-1";
var cognitoClientId = "__CLIENT_ID__";
var cognitoAuthDomain = "staff-auth.auth.eu-central-1.amazoncognito.com";
var callBackUrl = "https%3A%2F%2Finternal.sandybox.link%3A8443%2Fcallback.html"
var applicationBaseUri = "__INTRANET_WEB_APP_BASE_URI__"
var postLogoutRedirectPage = "/loggedout.html"


// START - Copied from https://tonyxu-io.github.io/pkce-generator/ -or- https://github.com/tonyxu-io/pkce-generator
function generateCodeVerifier() {
    var code_verifier = generateRandomString(128)
    document.getElementById("code_verifier").value = code_verifier
}
function generateRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
function generateCodeChallenge(code_verifier) {
    return code_challenge = base64URL(CryptoJS.SHA256(code_verifier));
}
function base64URL(string) {
    return string.toString(CryptoJS.enc.Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
// END of copied code


function getOrGenerateVerifier() {
    var verifier = sessionStorage.getItem('verifier');
    if (verifier == null) {
        sessionStorage.setItem('verifier', makeRandomString(42));
        verifier = sessionStorage.getItem('verifier');
    }
    return verifier;
}


function createRandomState() {
    var state = sessionStorage.getItem('state');
    if (state == null) {
        sessionStorage.setItem('state', makeRandomString(64));
        state = sessionStorage.getItem('state');
    }
    return state;
}


function makeRandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


function loginFunction() {
    console.log("Processing LOGIN action");
    var codeVerifier = getOrGenerateVerifier();
    var codeChallenge = generateCodeChallenge(codeVerifier);
    var state = createRandomState();
    var cognitoRequestUrl = "https://" + cognitoAuthDomain + "/oauth2/authorize?response_type=code&client_id=" + cognitoClientId + "&redirect_uri=" + callBackUrl + "&state=" + state + "&scope=profile+email+aws.cognito.signin.user.admin&code_challenge=" + codeChallenge + "&code_challenge_method=S256";
    console.log("cognitoRequestUrl=" + cognitoRequestUrl);
    alert("You will now be redirected to the login page");
    window.location.replace(cognitoRequestUrl);
}


function logoutFunction() {
    console.log("Processing LOGOUT action");
    // var logoutUrl = "https://" + cognitoAuthDomain + "/logout?client_id=" + cognitoClientId + "&logout_uri=" + applicationBaseUri + postLogoutRedirectPage + "&redirect_uri=" + applicationBaseUri + postLogoutRedirectPage;
    var logoutUrl = "https://" + cognitoAuthDomain + "/logout?client_id=" + cognitoClientId + "&logout_uri=" + applicationBaseUri + postLogoutRedirectPage;
    window.location.replace(logoutUrl);
}


function clearSessionStorage() {
    console.log("Clearing session storage");
    sessionStorage.clear();
    console.log("DONE Clearing session storage");
}


function goHome() {
    window.location.href = "/index.html";
}


function goLogout() {
    window.location.href = "/loggedout.html";
}


function base64URL(string) {
    return string.toString(CryptoJS.enc.Base64).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}


async function postDataUrlEncoded(url = '', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: data
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

async function postDataJsonAwsCognito(apiFunctionName = '', data = {}) {
    var url = "https://cognito-idp." + awsRegion + ".amazonaws.com/";
    console.log("postDataJsonAwsCognito(): posting to " + url);
    console.log("postDataJsonAwsCognito(): DATA: " + JSON.stringify(data));
    console.log("postDataJsonAwsCognito(): apiFunctionName=" + apiFunctionName);
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.' + apiFunctionName
        },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(data)
    });
    return response.json();
}


function getProfile(redirectTarget = null) {
    console.log("getProfile() CALLED");
    var accessToken = sessionStorage.getItem("access_token");
    if (accessToken) {
        console.log("Attempting to fetch profile");
        var data = {"AccessToken": accessToken};
        postDataJsonAwsCognito('GetUser', data).then(responseData => {
            console.log(responseData);
            console.log("---------- PROFILE DATA ----------");
            console.dir(responseData);
            console.log("==================================");
            if (responseData['Username']) {
                sessionStorage.setItem('sub', responseData['Username']);        
            }
            if (responseData['UserAttributes']) {
                console.log("UserAttributes data: " + responseData['UserAttributes'] );
                responseData['UserAttributes'].forEach(
                    function(attributeData){
                        console.log("attributeData=" + JSON.stringify(attributeData));
                        if (attributeData['Name'] == "email") {
                            sessionStorage.setItem('userEmail', attributeData['Value']);  
                        }
                        if (attributeData['Name'] == "email_verified") {
                            sessionStorage.setItem('emailVerified', attributeData['Value']);  
                        }
                        if (attributeData['Name'] == "given_name") {
                            sessionStorage.setItem('givenName', attributeData['Value']);  
                        }
                        if (attributeData['Name'] == "family_name") {
                            sessionStorage.setItem('familyName', attributeData['Value']);  
                        }
                    }
                );

            }
            if (redirectTarget) {
                window.location.href = "/index.html";
            }
        });
    } else {
        console.log("No access token - NOT fetching profile");
    }
}


function isLoggedIn() {
    var loggedIn = false;
    
    var userEmail = sessionStorage.getItem("userEmail");
    var accessToken = sessionStorage.getItem("access_token");
    var accessTokenExpires = sessionStorage.getItem("expires_at");

    console.debug("isLoggedIn(): userEmail=" + userEmail);
    console.debug("isLoggedIn(): accessToken=" + accessToken);
    console.debug("isLoggedIn(): accessTokenExpires=" + accessTokenExpires);

    now = Math.floor(Date.now() / 1000);
    if( now > accessTokenExpires ) {
        console.warn("SESSION EXPIRED");
    } else {
        console.log("SESSION STILL VALID (not-expired)");
    }
    
    if (userEmail && accessToken && accessTokenExpires) {
        loggedIn = true;
    }
    console.debug('isLoggedIn(): loggedIn=' + loggedIn);

    return loggedIn;
}

var accessTokenLoadedSuccessHtml = `
<div class="card bg-success text-white mb-4">
    <div class="card-body">Application Ready</div>
</div>
`;

function ajaxTest(){ 
    $.ajax(
        { 
            // crossdomain:true, 
            type:"GET",  
            url: applicationBaseUri + "/access-token-request", 
            success: function(r){ 
                console.log(JSON.stringify(r)); 
                $("#labsAccessTokenLoaderCard").html(accessTokenLoadedSuccessHtml);
            } 
        }
    ); 
}

$(document).ready(ajaxTest);
