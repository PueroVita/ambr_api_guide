const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');

const username = "<YOUR_USERNAME>";
const key_path = "../keys/<YOUR_PRIVATE_KEY_FILE_NAME>";

const test_file_path = "./filtered_variables1_formatted.csv"; // Try swapping out 1 with 2, 3 or 4 and see the output change!

const url = new URL("https://bioage.ambr.no");

// change these for different outputs
const gender = "female";
const language = "en";

const challenge_path = "/auth/challenge";
const verify_path = "/auth/verify";
const secure_path = "/auth/secure";
const variable_path = "/bioage_variable_metadata"
const quest_path = "/questionnaire?gender="+gender+"&language="+language
const bioage_path = "/bioage_predictor?gender="+gender;

function makeRequest(method,payload,custom_options){
    return new Promise((resolve,reject) => {
        const options = {
            ...custom_options,
            host: url.host,
            port: url.port,
            method,
        }
        let result = "";
        let request = https.request(options, function(response) {
            response.on('data', function (chunk) {
                result = result+chunk;
            });
            response.on('end', function(){
                resolve(JSON.parse(result))
            });
        });
        request.on('error', function(err) {
            reject(err);
        });
        request.write(payload);
        request.end()
    })
}

// Get variables names and descriptions with token
function getVarsWithAuth(token) {
    const var_options = {
        path: variable_path,
        headers: {
            'Authorization': "Bearer "+token
        }
    }
    makeRequest('GET',"",var_options)
    .then((response) => {
        // console.log(response.variables); // Takes a lot of space in the output, but please uncomment for a better display than the file
        fs.writeFileSync('./variables_with_desc.txt', JSON.stringify(response.variables));
        console.log("Variables written to file");
    },
        (err) => {
            console.log(err);
    });
}

// Get questionnaire json
function getQuestJsonWithAuth(token) {
    const quest_options = {
        path: quest_path,
        headers: {
            'Authorization': "Bearer "+token
        }
    }
    makeRequest('GET',"", quest_options)
    .then((response) => {
        console.log(typeof response);
        fs.writeFileSync('./questionnaire_json.json', JSON.stringify(response));
        console.log("Questionnaire written to file");
    },
        (err) => {
            console.log(err);
    });
}

// Bioage call with token
function bioAgeWithAuth(token) {
    const bio_options = {
        path: bioage_path,
        headers: {
            'Content-Type': 'text/csv',
            'Authorization': "Bearer "+token
        }
    }

    fs.readFile(test_file_path, 'utf-8', function (err, data) {
        if (err) {
            console.log("Error reading the file: " + err);
            process.exit(-2);
        }
        if(data) {
            makeRequest('POST',data,bio_options)
            .then((bioage) => {
                console.log("User: "+bioage.eid);
                console.log("Bioage: "+bioage.bioage);
                console.log("with metadata: "+bioage.metadata); // Metadata will contain many exciting things in the future ~
            },
            (err) => {
                console.log(err);
            });
        }
        else {
            console.log("No data");
            process.exit(-1);
        }
    });
}

// Call the API
makeRequest('GET',"",{}).then(
    (response) => {
        console.log(response);
    }
)

// ------------------- Authentication Guide ---------------------------

// 1. Load private key
const private_pem_key = fs.readFileSync(key_path, 'utf-8')
const private_key = crypto.createPrivateKey(
    {
        key: private_pem_key,
        format: 'pem',
    }
)

// 2. Request challenge (nonce) from server
const challenge_options = {
    path: challenge_path
}

makeRequest(
    'POST',
    '{"username":"'+username+'"}',
    challenge_options
).then(
    (nonceResponse) => {
        console.log("Nonce received: "+nonceResponse.nonce);

// 3. Sign the nonce
        const signature = crypto.sign("sha256" /*must match server*/, Buffer.from(nonceResponse.nonce,'utf-8'), {
        key: private_key,
        padding: crypto.constants.RSA_PKCS1_PADDING, 
        });
        const encoded_signature = signature.toString('base64');

// 4. Send signature to /auth/verify
        let verify_options = {
            path: verify_path
        }
        makeRequest(
            'POST',
            '{"username": "'+username+'","signature": "'+encoded_signature+'"}',
            verify_options
        )
        .then(
            (tokenResponse) => {
                console.log("Server response: "+JSON.stringify(tokenResponse));
                
// 5. Secure authentication
                let token = tokenResponse.token
                const secure_options = {
                path: secure_path,
                headers: {
                    'Authorization': "Bearer "+token
                }
            }

            makeRequest('POST',"",secure_options).then(
                (secureResponse) => {
                    console.log("Secure response: ", secureResponse);

                    // Once you have a valid token, you can make a call for bioage, variable names and the questionnaire
                    getVarsWithAuth(token);

                    getQuestJsonWithAuth(token); // response in questionnaire_json.json

                    bioAgeWithAuth(token); // response in variables_with_desc.txt

                }
            )

            },
            (err) => {
            console.log(err);
            }
        )
    },
    (err) => {
        console.log(err);
    }
)
