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
    // var logoutUrl = "https://" + cognitoAuthDomain + "/logout?client_id=" + cognitoClientId + "&logout_uri=" + encodeURIComponent(applicationBaseUri + postLogoutRedirectPage);
    var logoutUrl = "https://" + cognitoAuthDomain + "/logout?client_id=" + cognitoClientId + "&logout_uri=" + applicationBaseUri + postLogoutRedirectPage;
    console.log("FINAL logoutUrl: " + logoutUrl);
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
<a class="nav-link" href="link_card.html">
    <div class="sb-nav-link-icon"><i class="fas fa-tachometer-alt"></i></div>
    Link Access Card
</a>
`;

function pageInit() {
    accessTokenRefresh();
    getReleaseVersionInfo();
}

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

$(document).ready(pageInit);


class IssuedAccessCardRecord {
    constructor(employeeId, personDepartment = null, personName, personSurname, scannedStatus = null, scannedBuildingIdx = null, cardIdx = null, cardStatus = null, cardIssuedTimestamp = null, cardIssuedBy = null, PersonStatus = null) {
        this.employeeId = employeeId;
        this.personDepartment = personDepartment;
        this.personName = personName;
        this.personSurname = personSurname;
        this._scannedStatus = scannedStatus;
        this._scannedBuildingIdx = scannedBuildingIdx;
        this.cardIdx = cardIdx;
        this._cardStatus = cardStatus;
        this._cardIssuedTimestamp = cardIssuedTimestamp;
        this.cardIssuedBy = cardIssuedBy;
        this.PersonStatus = PersonStatus;

        this.cardIssuedTimestamp = function () {
            // REFERENCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
            // return new Date(this._cardIssuedTimestamp * 1000).toISOString()
            // return new Date(this._cardIssuedTimestamp * 1000).toLocaleString()
            let options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'shortOffset',
                hour12: false
            };
            return new Date(this._cardIssuedTimestamp * 1000).toLocaleString('en-GB', options);

        };

        this.scannedBuildingIdx = function () {
            if (this._scannedBuildingIdx == "null") {
                return "Not at office";
            }
            return this._scannedBuildingIdx;
        };

        this.scannedStatus = function () {
            if (this._scannedStatus == "scanned-out") {
                return "Not at Office";
            }
            return "In Office";
        };

        this.cardStatus = function () {
            // issued|lost|stolen|expired|revoked
            let label = this._cardStatus.charAt(0).toUpperCase() + this._cardStatus.slice(1);
            if (this._cardStatus == "issued") {
                return "<button type=\"button\" class=\"btn btn-success\">" + label + "</button>";
            } else if (this._cardStatus == "expired") {
                return "<button type=\"button\" class=\"btn btn-warning\">" + label + "</button>";
            }
            return "<button type=\"button\" class=\"btn btn-danger\">" + label + "</button>";
        };

    }
}


function apiCallGetActiveEmployeesWithAccessCardStatus(qty = 50, startToken = "", query_iterations = 1, addedEmployeeIds = []) {
    if ( query_iterations < 20 ) {
        query_iterations += 1;

        let accessToken = JSON.parse(sessionStorage.getItem("siteTokens")).AccessTokenData;
        let api_url = applicationBaseUri.replace("internal", "internal-api") + "/access-card-app/employees?qty=" + qty + "&status=active";
        api_url = api_url.replace(":8443", "");
        if (accessToken) {
            let api_url = applicationBaseUri.replace("internal", "internal-api") + "/access-card-app/employees?qty=" + qty + "&status=active";
            api_url = api_url.replace(":8443", "");
            if (startToken.length > 0) {
                api_url = api_url + "&start_key=" + encodeURIComponent(startToken);
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
                        // console.log(JSON.stringify(r)); 
                        var table = $('#datatablesSimple').DataTable();
                        for(var k in r.Employees) {
                            let record = r.Employees[k];
                            // console.log("RECORD: " + JSON.stringify(record));
                            if (addedEmployeeIds.includes(record.EmployeeId) ) {
                                console.log("Record for employee ID " + record.EmployeeId + " was already added to the table - skipping...");
                            } else {
                                table.row.add( 
                                    new IssuedAccessCardRecord(
                                        record.EmployeeId,
                                        record.PersonDepartment,
                                        record.PersonName,
                                        record.PersonSurname,
                                        record.ScannedStatus,
                                        record.ScannedBuildingIdx,
                                        record.CardIdx,
                                        record.CardStatus,
                                        record.CardIssuedTimestamp, 
                                        record.CardIssuedBy,
                                        record.PersonStatus
                                    )
                                );
                                addedEmployeeIds.push(record.EmployeeId);
                            }

                            
                        }

                        console.log("Next Start Key: " + JSON.stringify(r.LastEvaluatedKeyAsString));
                        table.draw();

                        if (r.LastEvaluatedKeyAsString.length > 0) {
                            console.log("Calling SELF again to fetch and render next batch of rows...");
                            apiCallGetActiveEmployeesWithAccessCardStatus(50, r.LastEvaluatedKeyAsString, query_iterations, addedEmployeeIds);
                        } else {
                            console.log("FETCHED ALL DATA AFTER " + query_iterations + " ITERATIONS"); 
                            return;
                        }

                    },
                    error: function(jqXHR, textStatus, errorThrown ) {
                        console.log("textStatus=" + textStatus);
                        console.log("errorThrown=" + errorThrown);
                    }
                }
            ); 
        }

    } else {
        console.log("More than 20 loop iterations... Safety stop pulled !!! For this LAB we should not have this much data");
    }
    
}

function createTableForActiveEmployees() {
    try {
        document.getElementById("labTableLoadSpinner").outerHTML = "";
    } catch (error) {
        console.error(error);
    }
    
    $('#datatablesSimple').DataTable({
        data: [],
        columns: [
            { 
                title: 'Employee Id',
                data: null,
                render: 'employeeId'
            },
            { 
                title: 'Department',
                data: null,
                render: 'personDepartment'
            },
            { 
                title: 'Employee Name',
                data: null,
                render: 'personName'
            },
            { 
                title: 'Employee Surname',
                data: null,
                render: 'personSurname'
            },
            { 
                title: 'Currently at Office',
                data: null,
                render: 'scannedStatus'
            },
            { 
                title: 'Current Office Location ID',
                data: null,
                render: 'scannedBuildingIdx'
            },
            { 
                title: 'Latest Card ID',
                data: null,
                render: 'cardIdx'
            },
            { 
                title: 'Latest Card Status',
                data: null,
                render: 'cardStatus'
            },
            { 
                title: 'Card Issued Timestamp',
                data: null,
                render: 'cardIssuedTimestamp'
            },
            { 
                title: 'Card Issued By',
                data: null,
                render: 'cardIssuedBy'
            },
        ],
    });
}

function getActiveEmployees() {

    createTableForActiveEmployees();
    apiCallGetActiveEmployeesWithAccessCardStatus();
    
}


function getReleaseVersionInfo(){ 
    $.ajax(
        { 
            // crossdomain:true, 
            type:"GET",  
            url: applicationBaseUri + "/release_version.txt", 
            success: function(r){ 
                console.log(r); 
                 $("#labReleaseVersion").text("Release: " + r);
            },
            error: function(jqXHR, textStatus, errorThrown ) {
                console.log("textStatus=" + textStatus);
                console.log("errorThrown=" + errorThrown);
            }
        }
    ); 
}


function resetMessageBanners() {
    $('#lab3InfoMessage').prop('style', 'display: none;');
    $('#lab3AlertMessage').prop('style', 'display: none;');
    $('#lab3SuccessMessage').prop('style', 'display: none;');
    $('#lab3WarningMessage').prop('style', 'display: none;');
}

function lookupEmployeeBtnClick() {
    resetMessageBanners();
    $('#lab3AccessCardLinkingForm').prop('style', 'display: none;');
    $('#lab3LinkAccessCardEventResponseRecordTableDiv').prop('style', 'display: none;');
    let employee_id = document.getElementById("lab3EmployeeId1").value;
    $('#lab3EmployeeLookupBtn').prop('disabled', true);
    document.getElementById("lab3InfoMessage").textContent = "Looking up employee ID " + employee_id;
    $('#lab3InfoMessage').prop('style', 'block');
    $('#lab3EmployeeInfoTable').prop('style', 'block');
    console.log("Looking up employee by Employee Number: " + employee_id);
    ajaxGetCardStatus(employee_id);


    // TODO look at https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#setting_and_clearing_timeouts on how I can timeout a lookup and then display a warning message


    /*
        If a user is LINKED:

            $ curl -H "Authorization: ${JWT_TOKEN}" https://$API_DOMAIN/access-card-app/employee/$EMP_ID/access-card-status
            {
                "AccessCardLinked": true, 
                "EmployeeStatus": "Active", 
                "Name": "Name100000000003", 
                "Surname": "Surname100000000003", 
                "AccessCardData": {
                    "1665546180": {
                        "CardId": "100000000118", 
                        "IssuedBy": "SYSTEM", 
                        "CardStatus": "issued"
                    }
                }
            }

        A person busy onboarding:

        $ curl -H "Authorization: ${JWT_TOKEN}" https://$API_DOMAIN/access-card-app/employee/$EMP_ID/access-card-status
        {
            "AccessCardLinked": false, 
            "EmployeeStatus": "Onboarding", 
            "Name": "Name100000000103", 
            "Surname": "Surname100000000103", 
            "AccessCardData": {}
        }
    */


}


function getLatestCardDetails(cardData) {
    /*
        In the case of multiple issued cards, we only want the latest one.
    */
    fCardId = "Not Issued Yet";
    fIssuedBy = "-";
    fCardStatus = "Not Issued";
    fIssuedTimestamp = "-";
    console.log("getLatestCardDetails(): cardData=" + JSON.stringify(cardData));
    var keys = Object.keys(cardData);
    var size = keys.length;
    if (size > 0) {
        keys.sort(function(a, b) {
            return a - b;
        });
        console.log("keys: " + keys);

        var latestKey = keys[keys.length - 1];
        console.log("getLatestCardDetails(): latestKey=" + latestKey);
        var latestCardData = cardData[latestKey];
        console.log("getLatestCardDetails(): latestCardData=" + JSON.stringify(latestCardData));

        fCardId = cardData[latestKey].CardId;
        fIssuedBy = cardData[latestKey].IssuedBy;
        fCardStatus = cardData[latestKey].CardStatus;
        fIssuedTimestamp = parseInt(latestKey);
    }
    var result = {
        cardId: fCardId,
        issuedBy: fIssuedBy,
        cardStatus: fCardStatus,
        issuedTimestamp: fIssuedTimestamp,
    }
    console.log("getLatestCardDetails(): result=" + JSON.stringify(result));
    return result
}

function ajaxGetCardStatus(employeeId){ 
    const acceptedEmployeeStatusForDisplayingCardLinkForm = [
        "Onboarding",
    ]
    let accessToken = JSON.parse(sessionStorage.getItem("siteTokens")).AccessTokenData;
    let api_url = applicationBaseUri.replace("internal", "internal-api") + "/access-card-app/employee/" + employeeId + "/access-card-status";
    api_url = api_url.replace(":8443", "");
    if (accessToken) {
        $.ajax(
            { 
                crossdomain:true, 
                type:"GET",  
                url: api_url, 
                headers: {
                    "Authorization": accessToken
                },
                success: function(r){ 
                    console.log("ajaxGetCardStatus(): Ajax Call Succeeded");
                    console.log("ajaxGetCardStatus(): r:" + JSON.stringify(r));
                    var table;
                    try {
                        table = createTableForEmployeeDetails();
                    } catch (exceptionVar) {
                        console.log("ajaxGetCardStatus(): Exception: " + exceptionVar);
                    }
                    var cardData = getLatestCardDetails(r.AccessCardData);
                    table.row.add( 
                        new IssuedAccessCardRecord(
                            employeeId,
                            null,
                            r.Name,
                            r.Surname,
                            null,
                            null,
                            cardData.cardId,
                            cardData.cardStatus,
                            cardData.issuedTimestamp, 
                            cardData.issuedBy,
                            r.EmployeeStatus
                        )
                    );
                    table.draw();
                    $('#lab3EmployeeLookupBtn').prop('disabled', false);

                    // Display the linking form IF the employee status is "onboarding"
                    if ( acceptedEmployeeStatusForDisplayingCardLinkForm.includes(r.EmployeeStatus)) {
                        $('#lab3AccessCardLinkingForm').prop('style', 'block');
                        console.log("ajaxGetCardStatus(): Employee Status is onboarding - displaying the linking form...");
                    } else {
                        console.log("ajaxGetCardStatus(): Employee Status is NOT onboarding, therefore not displaying the linking form...");
                    }

                },
                error: function(jqXHR, textStatus, errorThrown ) {
                    resetMessageBanners();
                    console.error("ajaxGetCardStatus(): textStatus=" + textStatus);
                    console.error("ajaxGetCardStatus(): errorThrown=" + errorThrown);
                    $('#lab3EmployeeLookupBtn').prop('disabled', false);
                    document.getElementById("lab3AlertMessage").textContent = "FAILED to look up employee ID " + employeeId + ". Please check the error message in the console to investigate";
                    $('#lab3AlertMessage').prop('style', 'block');
                    document.getElementById("lab3TableLoadSpinner").outerHTML = "";
                }
            }
        ); 
    }
}

function createTableForEmployeeDetails() {
    try {
        document.getElementById("lab3TableLoadSpinner").outerHTML = "";
    } catch (error) {
        console.log("createTableForEmployeeDetails(): Exception:" + error);
    }
    
    return $('#lab3EmployeeDetailsTable').DataTable({
        searching: false,
        destroy: true,
        paging: false,
        ordering: false,
        info: false,
        data: [],
        columns: [
            { 
                title: 'Employee Status',
                data: null,
                render: 'PersonStatus'
            },
            { 
                title: 'Employee Name',
                data: null,
                render: 'personName'
            },
            { 
                title: 'Employee Surname',
                data: null,
                render: 'personSurname'
            },
            { 
                title: 'Last Issued Card ID',
                data: null,
                render: 'cardIdx'
            },
            { 
                title: 'Issued By',
                data: null,
                render: 'cardIssuedBy'
            },
            { 
                title: 'Card Status',
                data: null,
                render: 'cardStatus'
            },
            { 
                title: 'Card Issued Timestamp',
                data: null,
                render: 'cardIssuedTimestamp'
            },
        ],
    });
}

class LinkAccessCardEventResponseRecord {
    constructor(event_bucket_name, event_key, event_key_version, event_created_timestamp, event_request_id) {
        this.eventBucketName = event_bucket_name;
        this.eventKey = event_key;
        this.eventKeyVersion = event_key_version;
        this._eventCreatedTimestamp = event_created_timestamp;
        this.eventRequestId = event_request_id;

        this.eventCreatedTimestamp = function () {
            // REFERENCE: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#options
            let options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC',
                timeZoneName: 'shortOffset',
                hour12: false
            };
            return new Date(this._eventCreatedTimestamp * 1000).toLocaleString('en-GB', options);

        };
    }
}

function createTableForLinkAccessCardEventResponseRecord() {
    try {
        document.getElementById("lab3TableLoadSpinner2").outerHTML = "";
    } catch (error) {
        console.log("createTableForLinkAccessCardEventResponseRecord(): Exception:" + error);
    }
    
    return $('#lab3LinkAccessCardEventResponseRecordTable').DataTable({
        searching: false,
        destroy: true,
        paging: false,
        ordering: false,
        info: false,
        data: [],
        columns: [
            { 
                title: 'Event Repository Name (Bucket)',
                data: null,
                render: 'eventBucketName'
            },
            { 
                title: 'Event Record Key',
                data: null,
                render: 'eventKey'
            },
            { 
                title: 'Event Record Version Identifier',
                data: null,
                render: 'eventKeyVersion'
            },
            { 
                title: 'Recorded Event Timestamp',
                data: null,
                render: 'eventCreatedTimestamp'
            },
            { 
                title: 'Generated Request ID',
                data: null,
                render: 'eventRequestId'
            },
        ],
    });
}

function parseJwt (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
};

function linkAccessCardToEmployeeBtnClick() {
    console.log("linkAccessCardToEmployeeBtnClick(): Linking access card to employee...");
    document.getElementById("lab3InfoMessage").textContent = "Request for Linking Access Card to Employee Sent...";

    $('#lab3EmployeeInfoTable').prop('style', 'display: none;');
    var completeOnboarding = document.getElementById("lab3CompleteOnboarding").checked;
    
    let card_id = document.getElementById("lab3AccessCardId1").value;
    let employee_id = document.getElementById("lab3EmployeeId1").value;
    console.log("linkAccessCardToEmployeeBtnClick(): completeOnboarding=" + completeOnboarding);

    /**
     * CURL Example: curl -X POST -H "Authorization: ${JWT_TOKEN}" -H "Content-Type: application/json" -d "{\"CardId\": \"$CARD_ID\", \"CompleteOnboarding\": false, \"LinkedBy\": \"10000000001\"}"  https://$API_DOMAIN/access-card-app/employee/$EMP_ID/link-card
     * 
     * Post Submit - expected Success Message:
     * {
     *      "event-bucket-name": "lab3-events-khjidgf", 
     *      "event-key": "link_employee_and_access_card_32acf76ef54390078bfd4b2120eecb05f0d82158a14d35e070ec74b023ed315f.request", 
     *      "event-key-version": "llTR1XqnLWGsRpclZESjCsG4BF9IEp3R", 
     *      "event-created-timestamp": 1665834703, 
     *      "event-request-id": "20837024a2a1a0375c23c3fc427e912ac9c3bd8239d939e0dec4b836633f9eba"
     * }
     */
     let accessToken = JSON.parse(sessionStorage.getItem("siteTokens")).AccessTokenData;
     let idToken = parseJwt(JSON.parse(sessionStorage.getItem("siteTokens")).OidcData);
     let api_url = applicationBaseUri.replace("internal", "internal-api") + "/access-card-app/employee/" + employee_id + "/link-card";
     api_url = api_url.replace(":8443", "");
     var requestData = {
        "CardId": card_id, 
        "CompleteOnboarding": completeOnboarding, 
        "LinkedBy": idToken["custom:employee-id"]
    }
    console.log("linkAccessCardToEmployeeBtnClick(): requestData=" + JSON.stringify(requestData));
    if (accessToken) {
        $.ajax(
            { 
                crossdomain:true, 
                type:"POST",  
                url: api_url,
                data: JSON.stringify(requestData),
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                headers: {
                    "Authorization": accessToken
                },
                success: function(r){ 
                    document.getElementById("lab3InfoMessage").textContent = "Response Received";
                    console.log("linkAccessCardToEmployeeBtnClick(): Ajax Call Succeeded");
                    console.log("linkAccessCardToEmployeeBtnClick(): r:" + JSON.stringify(r));
                    var table;
                    try {
                        table = createTableForLinkAccessCardEventResponseRecord();
                    } catch (exceptionVar) {
                        console.log("linkAccessCardToEmployeeBtnClick(): Exception: " + exceptionVar);
                    }
                     
                    table.row.add( 
                        new LinkAccessCardEventResponseRecord(
                            r["event-bucket-name"],
                            r["event-key"],
                            r["event-key-version"],
                            r["event-created-timestamp"],
                            r["event-request-id"],
                        )
                    );
                    table.draw();
 
                },
                error: function(jqXHR, textStatus, errorThrown ) {
                    resetMessageBanners();
                    $('#lab3AlertMessage').prop('style', 'block');
                    document.getElementById("lab3AlertMessage").textContent = "Request Failed";
                    console.error("ajaxGetCardStatus(): textStatus=" + textStatus);
                    console.error("ajaxGetCardStatus(): errorThrown=" + errorThrown);
                    document.getElementById("lab3TableLoadSpinner2").outerHTML = "";
                }
            }
        ); 
    }
}
