Either generate a key
```
cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f <YOUR USERNAME>
```
which you register with Ambr Institute, or drop your existing PEM key and .pub file in '/keys'
then to test use `client/tester.py`, `client/tester.js` or `client/tester_await.js`. 
They can be run with 
```
node client/tester.js
node client/tester_await.js
python client/tester.py
```
remember to install dependencies where relevant

to test API from command line
```
curl https://bioage.ambr.no/
```