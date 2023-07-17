const blockTools = require("@sanity/block-tools").default;
const { download_image } = require("./image_processor");
const jsdom = require("jsdom");
const uuid = require("@sanity/uuid");
const fs = require("fs");
const { JSDOM } = jsdom;
const defaultSchema = require("./defaultSchema");

let promises = [];

const DEFAULT_BLOCK = Object.freeze({
  _type: "block",
  markDefs: [],
  style: "normal",
});

const HTML_HEADER_TAGS = {
  h1: { ...DEFAULT_BLOCK, style: "h1" },
  h2: { ...DEFAULT_BLOCK, style: "h2" },
  h3: { ...DEFAULT_BLOCK, style: "h3" },
  h4: { ...DEFAULT_BLOCK, style: "h4" },
  h5: { ...DEFAULT_BLOCK, style: "h5" },
  h6: { ...DEFAULT_BLOCK, style: "h6" },
};

const HTML_BLOCK_TAGS = {
  p: DEFAULT_BLOCK,
  blockquote: { ...DEFAULT_BLOCK, style: "blockquote" },
  code: { ...DEFAULT_BLOCK, style: "code" },
};

const blockContentType = defaultSchema
  .get("blogPost")
  .fields.find((field) => field.name === "body").type;

function tagName(el) {
  if (!el || el.nodeType !== 1) {
    return undefined;
  }
  return el.tagName.toLowerCase();
}

async function parseHTML(docs) {
  const { content, title, id } = docs;
  const rules = [
    // for text and headings
    {
      deserialize(el, next) {
        let _key = uuid.uuid();
        const blocks = { ...HTML_BLOCK_TAGS, ...HTML_HEADER_TAGS };
        let block = blocks[tagName(el)];
        if (!block) {
          return undefined;
        }
        // Don't add blocks into list items
        if (el.parentNode && tagName(el) === "li") {
          return next(el.childNodes);
        }
        // Add an id property for heading blocks
        if (/^h\d/.test(tagName(el))) {
          let heading = {
            ...block,
            _key,
            id: _key,
            children: next(el.childNodes),
          };
          heading.children.forEach((child) => {
            child._key = uuid.uuid();
          });
          return heading;
        }

        let result = {
          _key,
          ...block,
          children: next(el.childNodes),
        };

        let new_line = { _type: "span", marks: [], text: "\n" };

        if (result.children.length === 0) {
          result.children.push(new_line);
        }

        // add unique keys to all children
        result.children.forEach((child) => {
          child._key = uuid.uuid();
        });
        return result;
      },
    },

    {
      deserialize(el, next, block) {
        if (!el) {
          return undefined;
        }
        if (el.tagName.toLowerCase() !== "pre") {
          return undefined;
        }
        const code = el.children[0];
        const childNodes =
          code && code.tagName.toLowerCase() === "code"
            ? code.childNodes
            : el.childNodes;
        let text = "";
        childNodes.forEach((node) => {
          text += node.textContent;
        });
        let co = block({
          _type: "code",
          language: el.dataset.language,
          text,
        });
        return co;
      },
    },

    {
      deserialize(el, next, block) {
        if (!el) {
          return undefined;
        }
        if (el.tagName.toLowerCase() !== "img") {
          return undefined;
        }
        let imageTag = el;
        /**
         * @type {HTMLCollection}
         */
        const src = imageTag.getAttribute("src");
        const imageId = uuid.uuid();

        // trigger side job
        download_image(src, id, imageId).then((res) => {
          promises.push(res);
          fs.writeFileSync(
            "images/" + id + "/image_map.json",
            JSON.stringify(promises),
          );
          // write the promises in /images/id
        });
        const alt = imageTag.getAttribute("alt");
        let img = {
          _type: "image",
          image: {
            id: imageId,
          },
        };
        return img;
      },
    },
  ];
  /**
   * Since we're in a node context, we need
   * to give block-tools JSDOM in order to
   * parse the HTML DOM elements
   */
  return content
    ? blockTools.htmlToBlocks(content, blockContentType, {
        rules,
        parseHtml: (html) => new JSDOM(html).window.document,
      })
    : [];
}

module.exports = parseHTML;
