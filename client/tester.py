import base64
import httpx
import pandas as pd
import time
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

USERNAME = "<YOUR_USERNAME>"
KEY_PATH = "../keys/<YOUR_PRIVATE_KEY_FILE_NAME>"
API_BASE = "https://bioage.ambr.no"

# 1. Load private key
with open(KEY_PATH, "rb") as f:
    private_key = serialization.load_pem_private_key(f.read(), password=None)

# 2. Request challenge (nonce) from server
challenge_url = f"{API_BASE}/auth/challenge"
res = httpx.post(challenge_url, json={"username": USERNAME})
if res.status_code != 200:
    raise SystemExit(f"Failed to get challenge: {res.text}")

nonce = res.json()["nonce"]
print(f"Nonce received: {nonce}")

# 3. Sign the nonce
signature = private_key.sign(
    nonce.encode(),
    padding.PKCS1v15(),
    hashes.SHA256()  # must match the server
)
encoded_signature = base64.b64encode(signature).decode()

# 4. Send signature to /auth/verify
verify_url = f"{API_BASE}/auth/verify"
verify_payload = {
    "username": USERNAME,
    "signature": encoded_signature
}
res = httpx.post(verify_url, json=verify_payload)
token = res.json()["token"]
print(f"Server response: {res.status_code} {res.text}")

# 4.5 Secure everything went smoothly
secure_url = f"{API_BASE}/auth/secure"
secure_res = httpx.post(
    secure_url,
    headers={"Authorization": f"Bearer {token}"}
)
print("Secure response:", secure_res.json())

# 5. Predict bioage from csv file input
print("Securely predicting bioage from csv input...")
f = open("./filtered_variables1_formatted.csv", "r")
lines = f.read()

tic = time.time()
predictor_url = f"{API_BASE}/bioage_predictor?gender=female"
secure_res = httpx.post(
    predictor_url,
    content=lines,
    headers={
        "Content-Type": "text/csv",
        "Authorization": f"Bearer {token}"
    }
)
print(f"    Bioage prediction response from csv input in {time.time() - tic:.2f}s, female:", secure_res.json())

tic = time.time()
predictor_url = f"{API_BASE}/bioage_predictor?gender=male"
secure_res = httpx.post(
    predictor_url,
    content=lines,
    headers={
        "Content-Type": "text/csv",
        "Authorization": f"Bearer {token}"
    }
)
print(f"    Bioage prediction response from csv input in {time.time() - tic:.2f}s, male:", secure_res.json())


# 6. Predict bioage from json input
print("Securely predicting bioage from json input...")
df = pd.read_csv("./filtered_variables1_formatted.csv")
input_data = df.to_dict(orient="records")[0]

tic = time.time()
predictor_url = f"{API_BASE}/bioage_predictor?gender=female"
secure_res = httpx.post(
    predictor_url,
    json=input_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)
print(f"    Bioage prediction response from json input in {time.time() - tic:.2f}s, female:", secure_res.json())

tic = time.time()
predictor_url = f"{API_BASE}/bioage_predictor?gender=male"
secure_res = httpx.post(
    predictor_url,
    json=input_data,
    headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
)
print(f"    Bioage prediction response from json input in {time.time() - tic:.2f}s, male:", secure_res.json())


# 7. Get metadata
variable_metadata_url = f"{API_BASE}/bioage_variable_metadata"
secure_res = httpx.get(
    variable_metadata_url,    
    headers={
        "Content-Type": "text/csv",
        "Authorization": f"Bearer {token}"
    }
)
