/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '240173505392-26dpbjiauba547ea1qa28d7fh0sdgvrk.apps.googleusercontent.com';
const API_KEY = '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';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

let rawResults = [];
let sunburstData = {};


const authorizeBtn = document.querySelector('#authorize_button');
const signOutBtn = document.querySelector('#signout_button');

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        localStorage.setItem('token', gapi.client.getToken().access_token);
        token = localStorage.getItem('token');
        emails = await listAllEmails(token, 'category:promotions');
        sizeofInbox = await getEmailsInformation(token, emails);
        console.log(sizeofInbox, "size of inbox");
        console.log(`${parseFloat(sizeofInbox / 1048576).toFixed(2)}MB`)
        console.log(`${parseFloat((sizeofInbox / 1048576) * 2.26 / 1000).toFixed(2)} kilograms of CO2 per year`);
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }


}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}


async function listAllEmails(token, query) {
    const params = {
        method: 'GET',
        q: query,
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'application/json',
        }
    };

    var previousResponse = await doFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", "", [], params);
    return previousResponse
}

async function getEmailsInformation(token, messages) {
    sizes = [];
    body = "";
    i = 1;
    limit = messages.length - (messages.length * 0.25);
    const regex = /(?<="sizeEstimate":.)[0-9]*/gi

    console.log('Limit: ', limit)

    while (messages.length > 0) {
        body = body.concat(`--batch_boundary\r\nContent-Type:application/http\r\n\r\nGET /gmail/v1/users/me/messages/${messages[0].id}?fields=sizeEstimate,labelIds,payload.headers\r\n\r\n`);
        messages.shift();
        i++;
        if (i >= 20) {
            console.log("meer dan 20");
            body = body.concat('--batch_boundary--');
            const response = await batchGet(body, token);
            const text = await response.text();
            parseBatchResponse(text);
            const sizeEstimates = await text.match(regex);
            if (sizeEstimates != null) {
                sizes = sizes.concat(sizeEstimates);
            }
            console.log('Amount of sizes in list: ', sizes.length)
            body = "";
            i = 0;
        }


    }
    filterRawResults(rawResults);

    const totalSizeEstimate = sizes.reduce((acc, value) => {
        return acc + parseInt(value);
    }, 0);

    return totalSizeEstimate;
}

function batchGet(body, token) {
    console.log("batch get");
    token = localStorage.getItem('token');
    console.log(body, token, "body en token in batchGet functie")
    const params = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            'Content-Type': 'multipart/mixed; boundary=batch_boundary',
        },
        body: body
    };

    return fetch('https://www.googleapis.com/batch/gmail/v1', params)
}

function doFetch(url = "https://gmail.googleapis.com/gmail/v1/users/me/messages",
    pageToken = "",
    previousResponse = [],
    params) {


    return fetch(`${url}?pageToken=${pageToken}&maxResults=${500}`, params)
        .then(response => response.json())
        .then(data => {
            previousResponse = previousResponse.concat(data.messages);
            if (data.nextPageToken) {
                return doFetch("https://gmail.googleapis.com/gmail/v1/users/me/messages", data.nextPageToken, previousResponse, params)
            } else {
                return previousResponse;
            }
        });
}

function parseBatchResponse(response) {
    const lines = response.split('\r\n');

    for (const line of lines) {
        if (line[0] === '{') {
            rawResults.push(JSON.parse(line));
        }
    }
};

function filterRawResults(results) {
    //Create a new array of objects of each message with the information I want
    let filteredResults = results.map((result) => {
        return {
            category: result.labelIds[0],
            inbox: result.labelIds.find((id) => id.includes("INBOX")),
            name: Object.values(result.payload.headers).find(
                (obj) => obj.name === "From")?.value.split('<')[0].trim(),
            company: Object.values(result.payload.headers).find(
                (obj) => obj.name === "From")?.value.match(/@(.*?)>/)[1],
            size: (result.sizeEstimate / 1048576),
            subject: Object.values(result.payload.headers).find(
                (obj) => obj.name === "Subject")?.value.trim(),
        };
    });

    groupByCategoryResults(filteredResults, 'category');

}

function groupByCategoryResults(results, query) {

    let uniqueValues = [...new Set(results.map(x => x[query]))];

    let categorizedResults =
    {
        name: "sunburst",
        children: uniqueValues.map((val) => {
            return {
                name: val,
                children: results.filter((x) => x[query] === val)
            }
        })
    }

    groupByCompanyResults(categorizedResults);
}

function groupByCompanyResults(results) {
    let categorizeByCompanyResults = results.children.map(item => {
        let newSubArray = {};
        for (let i = 0; i < item.children.length; i++) {
            let company = item.children[i].company;
            if (!newSubArray[company]) {
                newSubArray[company] = []

            }
            newSubArray[company].push(item.children[i]);
        }
        let finalArray = [];
        for (let company in newSubArray) {
            finalArray.push({ name: company, children: newSubArray[company] });
        }
        item.children = finalArray;
        return item;
    });

    console.log(categorizeByCompanyResults, "comp");
    groupByNameResults(categorizeByCompanyResults);

    let sunburstData = {
        name: "Sunburst",
        children: categorizeByCompanyResults
    }

    console.log(sunburstData)
}

function groupByNameResults(results) {

    let finalResults = results.map(item => {
        let newSubArray = {};
        for (let i = 0; i < item.children.length; i++) {
            for (let k = 0; k < results[i].children[i].children.length; k++) {
                let name = item.children[k].name;
                if (!newSubArray[name]) {
                    newSubArray[name] = []
                }
                newSubArray[name].push(item.children[k]);
            }
            let finalArray = [];
            for (let name in newSubArray) {
                finalArray.push({ name: name, children: newSubArray[name] });
            }
            item.children = finalArray;
            return item;
        }
    });

    console.log(finalResults, "groupedArRAY")
}




/*TIJDELIJK*/

import data from "../data.json" assert { type: "json" };
window.addEventListener("load", filterRawResults(data));

/*TIJDELIJK*/

authorizeBtn.addEventListener('click', () => {
    handleAuthClick()
});

signOutBtn.addEventListener('click', () => {
    handleSignoutClick()
});