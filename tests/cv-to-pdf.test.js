// scripts/cv-to-pdf.js — flag parsing, page counting, print CSS and the template render.
// No Chrome needed: puppeteer is loaded, never launched.
const { test } = require("bun:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const SCRIPT = path.join(__dirname, "..", "scripts", "cv-to-pdf.js");
const { DEFAULTS, parseArgs, countPages, fitCss, renderHtml } = require(SCRIPT);
const siteCv = require("../src/_data/cv.js");

test("parseArgs: defaults, positionals and every numeric tunable as a kebab flag", () => {
  const { positional, opts } = parseArgs(["cv-data.js", "out.pdf"]);
  assert.deepEqual(positional, ["cv-data.js", "out.pdf"]);
  assert.deepEqual(opts, { ...DEFAULTS, pages: 2, fit: true });

  const flags = Object.keys(DEFAULTS).filter((k) => typeof DEFAULTS[k] === "number");
  const argv = flags.flatMap((k, i) => ["--" + k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()), String(i + 100)]);
  const parsed = parseArgs(argv).opts;
  flags.forEach((k, i) => assert.equal(parsed[k], i + 100, k));
});

test("parseArgs: --margin sets all four, behaviour switches", () => {
  const { opts } = parseArgs(["--margin", "10", "--no-fit", "--no-education-page-break", "--pages", "3"]);
  assert.deepEqual([opts.marginTop, opts.marginBottom, opts.marginLeft, opts.marginRight], [10, 10, 10, 10]);
  assert.equal(opts.fit, false);
  assert.equal(opts.educationPageBreak, false);
  assert.equal(opts.pages, 3);
});

test("CLI: unknown flag and missing input exit 1", () => {
  const bad = spawnSync("node", [SCRIPT, "cv.js", "--margins", "1"], { encoding: "utf8" });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /Unknown flag: --margins/);
  const none = spawnSync("node", [SCRIPT], { encoding: "utf8" });
  assert.equal(none.status, 1);
  assert.match(none.stderr, /^Usage: node scripts\/cv-to-pdf.js/);
});

test("countPages reads the largest /Count in the page tree", () => {
  const pdf = Buffer.from("%PDF-1.4\n<< /Type /Pages /Count 2 /Kids [...] >>\n<< /Type /Pages /Count 1 >>\n", "latin1");
  assert.equal(countPages(pdf), 2);
  assert.equal(countPages(Buffer.from("not a pdf")), 0);
});

test("fitCss puts margins in @page and honours the education break", () => {
  const css = fitCss({ ...DEFAULTS, marginTop: 20, sectionGap: 9 });
  assert.match(css, /margin: 20mm 14mm 18mm 14mm;/);
  assert.match(css, /\.cv-section \{ margin-bottom: 9px; \}/);
  assert.match(css, /break-before: page !important/);
  assert.match(fitCss({ ...DEFAULTS, educationPageBreak: false }), /break-before: auto !important/);
});

test("renderHtml renders the site CV with icons and the fit overrides", () => {
  const html = renderHtml(siteCv, { ...DEFAULTS, marginTop: 21 });
  assert.match(html, /^<!DOCTYPE html>|<html/i);
  assert.ok(html.includes(siteCv.name), "name rendered");
  assert.ok(html.includes(siteCv.title.toUpperCase()), "title rendered (template upper-cases it)");
  assert.ok(html.includes('<div class="cv-page">'));
  // The {% icon %} tag must be registered (regressed once: 443e246) and emit sized inline SVG.
  assert.ok(!html.includes("{%") && !html.includes("{{"), "no unrendered template syntax");
  assert.match(html, /<svg width="\d+" height="\d+" /);
  // fitCss lands inside <head>, before any body content.
  const head = html.slice(0, html.indexOf("</head>"));
  assert.match(head, /margin: 21mm 14mm 18mm 14mm;/);
});

test("renderHtml works for a minimal cv-data.js (the shape generate-application writes)", () => {
  const html = renderHtml({ ...siteCv, name: "Test Person", employment: siteCv.employment.slice(0, 1) }, DEFAULTS);
  assert.ok(html.includes("Test Person"));
});
