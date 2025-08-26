
<p align="left">
  <img title="Ambr logo" src="ambr_logo.png" width="200">
</p>

# Ambr public API guide
This is the public API guide in Ambr Institute.

### API list
The current list of public APIs include:
1. **Bioage API:** Calculate biological age based on a set of 
  biological variable inputs. Available on [bioage.ambr.no](https://bioage.ambr.no)
  (see docs [here](https://bioage.ambr.no/docs))


## 1. Bioage API
- The Ambr Bioage API calculate biological age based on a set of 
  biological variable inputs.
- The Ambr Bioage API is available on [bioage.ambr.no](https://bioage.ambr.no)
  (see docs [here](https://bioage.ambr.no/docs)).
- This example code comes with 4 data samples, see
files `/client/filtered_variables_X_formatted.csv`.

***In order to access the API, you must register with Ambr Institute 
to add your key pair (or have Ambr Institute add it for you). 
Reach out to contact contact@ambr.no to request access.***

### 1.1. Authentication
The bioage API authenticates through a set of public-private ssh keys.

To generate a pair of keys, run the below command filling in for your 
preferred username:
```bash
cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f <YOUR USERNAME>
```
This will generate the key pair in your `/keys` folder, 

If you are already a registered user, drop your existing 
PEM key and `.pub` file in the `/keys` subfolder.

> **EXAMPLE:** With username set to 'AmbrTest' you may have, or have generated files named 
`/client/AmbrTest` and `/client/AmbrTest.pub`.


### 1.2. Test connection to API with curl
To test API connectivity from command line run
```bash
curl https://bioage.ambr.no/
```
If succesful you should see
```bash
StatusCode        : 200
StatusDescription : OK
Content           : ["Welcome to the bioage API of Ambr Institute!"]
RawContent ...
```


### 1.3. Test API in Python
1. Ensure your preferred Python environment has the relevant dependencies
   listed in `/client/requirements.txt` installed.
2. In the file `/client/tester.py` replace 
    - Line 8: Replace `<YOUR_USERNAME>` with the username set in your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Line 9: Replace `<YOUR_PRIVATE_KEY_FILE_NAME>` with name of your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Lines 53 and 83: Set which csv file example to run, default `filtered_variables1_formatted.csv`.
3. To test, run `client/tester.py`:
    ```bash
    cd client
    python tester.py
    ```
    This will authenticate with the API server, and if succesful 
    call the `/bioage_predictor` endpoint with request body set from 
    a csv file and from json (same data in both).

    With example file `./filtered_variables1_formatted.csv` you should expect printed output
    ```bash
    Nonce received: <HASH>>
    Server response: 200 {"authenticated":true,"token":"<TOKEN>"}
    Secure response: ['Welcome <YOUR_USERNAME> to the bioage API of Ambr Institute, you are AUTHENTICATED!']
    Securely predicting bioage from csv input...
        Bioage prediction response from csv input in 0.49s, female: {'bioage': 64.19, 'eid': '12345'}
        Bioage prediction response from csv input in 0.49s, male: {'bioage': 64.23, 'eid': '12345'}
    Securely predicting bioage from json input...
        Bioage prediction response from json input in 0.47s, female: {'bioage': 64.19, 'eid': '12345'}
        Bioage prediction response from json input in 0.43s, male: {'bioage': 64.23, 'eid': '12345'}
    ``` 

### 1.4. Test API in node.js
1. Ensure your preferred node environment has the relevant dependencies
   listed in `/client/package.json` installed.
2. In the file `/client/tester.js` replace 
    - Line 6: Replace `<YOUR_USERNAME>` with the username set in your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Line 7: Replace `<YOUR_PRIVATE_KEY_FILE_NAME>` with name of your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Line 9: Set which csv file example to run, default `filtered_variables1_formatted.csv`.
3. In the file `/client/tester_await.js` replace 
    - Line 6: Replace `<YOUR_USERNAME>` with the username set in your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Line 7: Replace `<YOUR_PRIVATE_KEY_FILE_NAME>` with name of your PEM file
      (In example in Section 1.1. above 'AmbrTest')
    - Line 4: Set which csv file example to run, default `filtered_variables1_formatted.csv`.
4. To test use  `client/tester.js` or `client/tester_await.js`;
    ```bash
    node client/tester.js
    node client/tester_await.js
    ```

