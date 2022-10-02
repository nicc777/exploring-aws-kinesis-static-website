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

function parseJwt (token) {
    // From https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

var accessTokenLoadedSuccessHtml = `
<div class="card bg-success text-white mb-4">
    <div class="card-body">Application Ready</div>
</div>
`;

var accessTokenLoadedErrorHtml = `
<div class="card bg-danger text-white mb-4">
    <div class="card-body">Failed to load access token</div>
    <div class="card-footer d-flex align-items-center justify-content-between">
        <a class="small text-white stretched-link" href="index.html">Retry</a>
        <div class="small text-white"><i class="fas fa-angle-right"></i></div>
    </div>
</div>
`;

var sideMenuHtml = `
<div class="sb-sidenav-menu-heading">Core</div>
<a class="nav-link" href="view_issued_cards.html">
    <div class="sb-nav-link-icon"><i class="fas fa-tachometer-alt"></i></div>
    View Issued Access Cards
</a>
<a class="nav-link" href="index.html">
    <div class="sb-nav-link-icon"><i class="fas fa-tachometer-alt"></i></div>
    Link Access Card
</a>
`;

function accessTokenRefresh(){ 
    $.ajax(
        { 
            // crossdomain:true, 
            type:"GET",  
            url: applicationBaseUri + "/access-token-request", 
            success: function(r){ 
                console.log(JSON.stringify(r)); 
                sessionStorage.setItem("siteTokens", JSON.stringify(r));
                
                var parsed_access_token = parseJwt(r.AccessTokenData);
                
                sessionStorage.setItem("parsedAccessToken", JSON.stringify(parsed_access_token));
                sessionStorage.setItem("accessTokenExp", parsed_access_token.exp);
                sessionStorage.setItem("accessTokenUsername", parsed_access_token.username);

                // Update UI
                $("#labsAccessTokenLoaderCard").html(accessTokenLoadedSuccessHtml);
                $("#labsMenu").html(sideMenuHtml);
                $("#labUsername").text(sessionStorage.getItem("accessTokenUsername"));
            },
            error: function(jqXHR, textStatus, errorThrown ) {
                console.log("textStatus=" + textStatus);
                console.log("errorThrown=" + errorThrown);
                $("#labsAccessTokenLoaderCard").html(accessTokenLoadedErrorHtml);
            }
        }
    ); 
}

$(document).ready(accessTokenRefresh);

function getActiveEmployees(qty, startToken) {

    let row_template = `<tr>
    <td>__FIELD_01__</td>
    <td>__FIELD_02__</td>
    <td>__FIELD_03__</td>
    <td>__FIELD_04__</td>
    <td>__FIELD_05__</td>
    <td>__FIELD_06__</td>
    <td>__FIELD_07__</td>
    <td>__FIELD_08__</td>
    <td>__FIELD_09__</td>
    <td>__FIELD_10__</td>
</tr>`;

    let accessToken = JSON.parse(sessionStorage.getItem("siteTokens")).AccessTokenData;
    let rows = "";
    var data = [];
    if (accessToken) {
        let api_url = applicationBaseUri.replace("internal", "internal-api") + "/access-card-app/employees?qty=" + qty + "&status=active";
        api_url = api_url.replace(":8443", "");
        if (startToken) {
            api_url = api_url + "&start_key=" + startToken;
        }
        $.ajax(
            { 
                crossdomain:true, 
                type:"GET",  
                url: api_url, 
                headers: {
                    "Authorization": accessToken
                },
                success: function(r){ 
                    console.log(JSON.stringify(r)); 
                    for(var k in r.Employees) {
                        let record = r.Employees[k];
                        let data_record = [];
                        console.log("RECORD: " + JSON.stringify(record));
                        let templ = structuredClone(row_template);
                        templ = templ.replace("__FIELD_01__", record.EmployeeId);
                        templ = templ.replace("__FIELD_02__", record.PersonDepartment);
                        templ = templ.replace("__FIELD_03__", record.PersonName);
                        templ = templ.replace("__FIELD_04__", record.PersonSurname);
                        templ = templ.replace("__FIELD_05__", record.ScannedStatus);
                        templ = templ.replace("__FIELD_06__", record.ScannedBuildingIdx);
                        templ = templ.replace("__FIELD_07__", record.CardIdx);
                        templ = templ.replace("__FIELD_08__", record.CardStatus);
                        templ = templ.replace("__FIELD_09__", record.CardIssuedTimestamp);
                        templ = templ.replace("__FIELD_10__", record.CardIssuedBy);
                        rows = rows + templ + "\n";
                        data_record.push(record.EmployeeId);
                        data_record.push(record.PersonDepartment);
                        data_record.push(record.PersonName);
                        data_record.push(record.PersonSurname);
                        data_record.push(record.ScannedStatus);
                        data_record.push(record.ScannedBuildingIdx);
                        data_record.push(record.CardIdx);
                        data_record.push(record.CardStatus);
                        data_record.push(record.CardIssuedTimestamp);
                        data_record.push(record.CardIssuedBy);
                        data.push(data_record);

                    }
                    // $("#labTableData").html(rows);
                    $('#datatablesSimple').DataTable( {
                        data: data
                    } );
                },
                error: function(jqXHR, textStatus, errorThrown ) {
                    console.log("textStatus=" + textStatus);
                    console.log("errorThrown=" + errorThrown);
                }
            }
        ); 
    }

    
}
