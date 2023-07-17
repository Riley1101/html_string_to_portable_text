const fs = require("fs");
const HTMLParser = require("node-html-parser");
const data = require("./activities.json");
const uuid = require("@sanity/uuid");
const refactor_image = require("./refactor_image");
const parseHTML = require("../src/parseHtml");

require("dotenv").config();

async function write_file(jsonDoc) {
  fs.writeFile("prep/result.json", JSON.stringify(jsonDoc), (err) => {
    if (err) {
      return;
    }
    console.log("File has been created");
  });
}

let mutations = data.slice(3, 8).map((doc) => {
  let title = HTMLParser.parse(doc.title).structuredText;
  return new Promise(async (resolve, reject) => {
    let parsePromise = await parseHTML(doc);
    let body = refactor_image(parsePromise);
    if (!body) reject("No body");
    let res = {
      create: {
        post_id: doc.id,
        id: uuid.uuid(),
        _type: "post",
        title: title,
        body,
      },
    };
    resolve(res);
  });
});

let promise = Promise.all(mutations);
promise.then((res) => {
  write_file(res);
});
