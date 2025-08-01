import base64
import httpx
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding

USERNAME = "userAlfa"
KEY_PATH = "./../keys/userAlfa"
API_BASE = "http://localhost:5064"

# 1. Load private key
with open(KEY_PATH, "rb") as file:
    private_key = serialization.load_pem_private_key(file.read(), password=None)

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

secure_url = f"{API_BASE}/auth/secure"
secure_res = httpx.get(
    secure_url,
    headers={"Authorization": f"Bearer {token}"}
)
secure_res.raise_for_status()
print("Secure response:", secure_res.json())