function refactor_image(docs) {
  docs = docs.map((doc) => {
    if (!doc.children) return doc;
    let image = doc.children[0];
    if (image && image._type === "image") {
      let id = image.image.id;
      id = id.replace(/-/g, "") ;
      let sanity_format = {
        _type: "image",
        asset: {
          _ref: id,
        },
      };
      return sanity_format;
    }
    return doc;
  });
  return docs;
}

module.exports = refactor_image;
