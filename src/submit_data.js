const fs = require("fs");
const postData = require("./sanity").postData;

async function get_image_map(id) {
  let image_map = fs.readFileSync("images/" + id + "/image_map.json");
  return JSON.parse(image_map);
}

async function get_result_map() {
  let result_map = fs.readFileSync("prep/result.json");
  return JSON.parse(result_map);
}

async function prep_images() {
  let results = await get_result_map();
  results = results.map(async (result, idx) => {
    let image_map = await get_image_map(result.create.post_id);
    result.create.body = result.create.body.map((doc) => {
      if (doc._type === "image") {
        let id = doc.asset._ref;
        let sanity_id = image_map.find((image) => {
          let file_name = image.originalFilename.replace(/-/g, "");
          return file_name === id;
        });
        doc.asset._ref = sanity_id._id;
      }
      return doc;
    });
    return result;
  });
  results = await Promise.all(results);
  return new Promise((resolve, reject) => {
    fs.writeFile("prep/result_mod.json", JSON.stringify(results), (err) => {
      console.log("File has been created");
      resolve(results);
    });
  });
}

function main() {
  prep_images().then((res) => {
    let data = fs.readFileSync("prep/result_mod.json");
    let json = JSON.parse(data);
    console.log(json);
    postData(json);
  });
}

main();
