const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { URL } = require('url');

const username = "userAlfa";
const key_path = "../keys/userAlfa";

const url = new URL("https://bioage.ambr.no");

const gender = "female";
const bioage_path = "/bioage_predictor/csv?gender="+gender;

const challenge_path = "/auth/challenge";
const verify_path = "/auth/verify";
const secure_path = "/auth/secure";
const variable_path = "/bioage_variable_metadata"

function makeRequest(method,payload,custom_options){
    return new Promise((resolve,reject) => {
        const options = {
            ...custom_options,
            host: url.host,
            port: url.port,
            method,
        }
        let result = null;
        let request = https.request(options, function(response) {
            response.on('data', function (chunk) {
                result = JSON.parse(chunk);
            });
            response.on('end', function(){
                resolve(result)
            });
        });
        request.on('error', function(err) {
            reject(err);
        });
        request.write(payload);
        request.end()
    })
}

// Bioage variables with token
function getVarsWithAuth(token) {
    const var_options = {
        path: bioage_path,
        headers: {
            'Authorization': "Bearer "+token
        }
    }
    makeRequest('GET',"",var_options)
    .then((response) => {
        console.log("Variables: "+response);
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

    fs.readFile("./filtered_variables1.csv", 'utf-8', function (err, data) {
        if (err) {
            console.log("Error reading the file: " + err);
            process.exit(-2);
        }
        if(data) {
            makeRequest('POST',data,bio_options)
            .then((bioage) => {
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
            verify_options)
        .then(
            (tokenResponse) => {
                console.log("Server response: 200"); // TODO update hardcoded 200
                console.log(tokenResponse);
                
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

                    // Once you have a valid token, you can make a call for bioage and the variable names
                    getVarsWithAuth(token);
                    bioAgeWithAuth(token);
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
