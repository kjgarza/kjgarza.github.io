// Data for the /ask/ page, built from src/_data/ and the public case studies.
// Published as /api/ask-data.json (src/ask-data.11ty.js) and read by both the
// page script and the endpoint: the model picks ids from it, the page renders them.
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const root = path.resolve(__dirname, "../..");
const EXCERPT_MAX_CHARS = 400;

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Strip inline markdown so excerpts read as plain text
const plain = (md) =>
  md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(" ", max - 1)) + "…");

// First prose paragraph under each H2
function sections(body) {
  return body
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const [heading, ...rest] = chunk.split("\n");
      const paragraph = rest
        .join("\n")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .find((p) => p && !/^(#|!\[|[-*] |\d+\. |\||```|<)/.test(p));
      return { id: slugify(heading), heading: heading.trim(), excerpt: truncate(plain(paragraph || ""), EXCERPT_MAX_CHARS) };
    })
    .filter((s) => s.excerpt);
}

// Public case studies only: password-protected ones never reach the model or the page
function readCaseStudies(dir = path.join(root, "src/work")) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => matter(fs.readFileSync(path.join(dir, f), "utf8")))
    .filter(({ data }) => data.layout === "layouts/case-study.njk" && data.passwordProtected !== true)
    .map(({ data, content }) => ({
      slug: data.permalink.split("/").filter(Boolean).pop(),
      url: data.permalink,
      title: data.title,
      company: data.company,
      sections: sections(content),
    }));
}

function buildAskData({
  work = require(path.join(root, "src/_data/work.js")),
  publications = require(path.join(root, "src/_data/publications.js")),
  tools = require(path.join(root, "src/_data/tools.js")),
  cv = require(path.join(root, "src/_data/cv.js")),
  caseStudies = readCaseStudies(),
} = {}) {
  return {
    work: work.map(({ id, company, title, description, tags, status, link }) => ({ id, company, title, description, tags, status, link })),
    publications: publications.map(({ id, title, publicationYear }) => ({ id, title, publicationYear })),
    tools: tools.map(({ name, description, type, link }) => ({ id: slugify(name), name, description, type: type.replace(/\s+/g, " "), link })),
    roles: cv.employment.map(({ role, company, location, period, bullets }) => ({
      id: `${slugify(company)}-${period.match(/\d{4}/)[0]}`,
      role,
      company,
      location,
      period: period.replace(/\s*—\s*/, " – "),
      summary: bullets && bullets[0],
    })),
    caseStudies,
  };
}

module.exports = { buildAskData, readCaseStudies, slugify };
