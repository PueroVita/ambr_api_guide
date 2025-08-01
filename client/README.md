Either generate a key
```
cd keys
ssh-keygen -t rsa -b 4096 -m PEM -f userAlfa
```
which you register, or drop your existing PEM key and pub file in '/keys'
then
```
docker compose up -d --build bioageapi
```

to test use `client/tester.py` or `client/tester.js`. 
They can be run with 
```
node client/tester.js
python client/tester.py
```

to test BioAge endpoint from command line
```
cd tests
curl -X POST http://localhost:5064/bioage_predictor\?gender=female \
          -H "Content-Type: text/csv" \
     --data-binary "@one_individual.csv"
```