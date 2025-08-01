var http = require('http');
var fs = require('fs');
var crypto = require('crypto');

const username = "userAlfa";
const key_path = "../keys/userAlfa";

const host = "localhost";
const port = 5064;

const gender = "female";
const bioage_path = "/bioage_predictor?gender="+gender;

const challenge_path = "/auth/challenge";
const verify_path = "/auth/verify";
const secure_path = "/auth/secure";

function makeRequest(method,payload,custom_options){
    return new Promise((resolve,reject) => {
        var options = {
            ...custom_options,
            host,
            port,
            method,
        }
        var result = null;
        var request = http.request(options, function(response) {
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

// Bioage call with token
function bioAgeWithAuth(token) {
    var bio_options = {
        path: bioage_path,
        headers: {
            'Content-Type': 'text/csv',
            'Authorization': "Bearer "+token
        }
    }

    fs.readFile("./filtered_variables.csv", 'utf-8', function (err, data) {
        if (err) {
            console.log("Error reading the file: " + err);
            process.exit(-2);
        }
        if(data) {
            makeRequest('POST',data,bio_options)
            .then((bioage) => {
                console.log("Bioage: "+bioage.bioage);
                console.log("with metadata: "+bioage.metadata); // Metadata will contain many exciting things int he future ~
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
var challenge_options = {
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

                    //Once the token is validated, you can make a call for bioage
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
