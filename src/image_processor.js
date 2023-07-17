const fs = require("fs");
const https = require("https"); // or 'https' for https:// URLs
const { upload_image } = require("./sanity");

async function download_image(url, id, fileName) {
  let promise = new Promise((resolve, reject) => {
    const path = "images/" + id;
    const filePath = path + "/" + fileName + ".jpg";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    const file = fs.createWriteStream(filePath);
    https.get(url, function (response) {
      response.pipe(file);
      // after download completed close filestream
      file.on("finish", async () => {
        file.close();
        let res = await upload_image(filePath, fileName);
        resolve(res);
      });
    });
  });
  return promise;
}

module.exports = { download_image };
