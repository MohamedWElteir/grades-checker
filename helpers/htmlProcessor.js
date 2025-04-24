const cheerio = require("cheerio");

async function pageToHTML(pageAsString) {
  const content = cheerio.load(pageAsString);
  return content;
}

module.exports = {
  pageToHTML,
};
