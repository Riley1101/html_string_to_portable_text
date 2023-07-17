const Schema = require("@sanity/schema").default;
const siitSchema = require("./siitBlocks");

module.exports = Schema.compile({
  name: "myBlog",
  types: [
    {
      type: "object",
      name: "blogPost",
      fields: [
        {
          title: "Title",
          type: "string",
          name: "title",
        },
        {
          title: "Body",
          name: "body",
          type: "array",
          of: siitSchema,
        },
      ],
    },
  ],
});
