require("dotenv").config();
const fs = require("fs");
const { createClient } = require("@sanity/client");

const PROJECT_ID = process.env.PROJECT_ID;
const DATASET = process.env.DATASET;
const SANITY_TOKEN = process.env.SANITY_TOKEN;

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  token: SANITY_TOKEN,
  apiVersion: "2021-10-21",
  useCdn: false,
});

const url = `https://${PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/${DATASET}`;

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${SANITY_TOKEN}`,
};

async function postData(mutations) {
  return await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ mutations }),
  }).then((re) => {
    return re.json();
  });
}

async function upload_image(filePath, fileName) {
  return client.assets
    .upload("image", fs.createReadStream(filePath), {
      filename: fileName,
    })
    .then((imageAsset) => {
      
      return imageAsset;
    });
}
module.exports = { postData, upload_image };
