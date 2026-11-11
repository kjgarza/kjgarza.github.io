// /api/ask-data.json: ids and display data for the /ask/ page and its endpoint.
// Built from global data plus the public case studies (see lib/ask/site-data.js).
const { buildAskData } = require("../lib/ask/site-data.js");

module.exports = class {
  data() {
    return { permalink: "/api/ask-data.json", eleventyExcludeFromCollections: true };
  }

  render({ work, publications, tools, cv }) {
    return JSON.stringify(buildAskData({ work, publications, tools, cv }));
  }
};
