import fs from "node:fs";
import crypto from "crypto";

const dataFile = "./filtered_variables1_formatted.csv";

const username = "<YOUR_USERNAME>";
const key_path = "../keys/<YOUR_PRIVATE_KEY_FILE_NAME>";

const url = new URL("https://bioage.ambr.no");

const gender = "female";

const CHALLENGE_PATH = `https://${url.host}:${url.port}/auth/challenge`;
const VERIFY_PATH = `https://${url.host}:${url.port}/auth/verify`;
const BIOAGE_PATH = `https://${url.host}:${url.port}/bioage_predictor?gender=${gender}`;
const SECURE_PATH = `https://${url.host}:${url.port}/auth/secure`;

const private_pem_key = fs.readFileSync(key_path, "utf-8");
const private_key = crypto.createPrivateKey({
  key: private_pem_key,
  format: "pem",
});

function getEncodedSignature(nonce) {
  const signature = crypto.sign("sha256", Buffer.from(nonce, "utf-8"), {
    key: private_key,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  });
  return signature.toString("base64");
}

async function fetchData(_url, _options) {
  const res = await fetch(_url, {
    method: _options?.method ?? "POST",
    headers: _options?.headers ?? {
      "Content-Type": "application/json",
    },
    body: _options?.body,
  });
  return res.json();
}

try {
  // get a challange from the server
  const nonceJson = await fetchData(CHALLENGE_PATH, {
    body: JSON.stringify({ username: username }),
  });
  const encoded_signature = getEncodedSignature(nonceJson.nonce);

  // answer it with a signature and get a Bearer token
  const verifiedJson = await fetchData(VERIFY_PATH, {
    body: JSON.stringify({
      username: username,
      signature: encoded_signature,
    }),
  });
  console.log(verifiedJson);
  const token = verifiedJson.token;

  // send CSV data for estimation, authorize with token
  const bioData = fs.readFileSync(dataFile, "utf-8");
  const estimateJson = await fetchData(BIOAGE_PATH, {
    headers: {
      "Content-Type": "text/csv",
      Authorization: "Bearer " + token,
    },
    body: bioData,
  });
  console.log(estimateJson);

  const secureJson = await fetchData(SECURE_PATH, {
    headers: {
      "Content-Type": "text/csv",
      Authorization: "Bearer " + token,
    },
  });
  console.log("Secure", secureJson);
} catch (err) {
  console.log("Err", err);
}
