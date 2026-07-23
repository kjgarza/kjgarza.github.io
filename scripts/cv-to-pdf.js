#!/usr/bin/env node
/*
 * Render a cv-data.js file through the site's cv.njk layout/template and
 * print it to a PDF via puppeteer — no Eleventy build required.
 *
 * Usage:
 *   node scripts/cv-to-pdf.js <path-to-cv-data.js> [output.pdf] [--pages N] [--no-fit]
 *   node scripts/cv-to-pdf.js applications/2026-07-21-digitalscience-senior-ui-engineer/cv-data.js
 *
 * By default the script shrinks the base print font size until the CV fits in
 * --pages (default 2) A4 pages.
 */
const fs = require("fs");
const path = require("path");
const nunjucks = require("nunjucks");
const puppeteer = require("puppeteer");

const root = path.resolve(__dirname, "..");

const CHROME =
  process.env.CHROME_PATH ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

// A4 at 96dpi, in CSS px.
const A4_W = 794;
const A4_H = 1123;
const MM = 96 / 25.4;

/* ─────────────────────────────────────────────────────────────────────────
   TUNABLES — edit these defaults, or override any of them from the CLI.
   Every key below is settable as --<kebab-case-key> <value>, e.g.
     --margin-top 20  --section-gap 14  --font 9.5
   ───────────────────────────────────────────────────────────────────────── */
const DEFAULTS = {
  // Page margins, in mm.
  marginTop: 25,
  marginBottom: 18,
  marginLeft: 14,
  marginRight: 14,

  // Overall content scale, and the floor the auto-fit loop shrinks to.
  // (The site's print CSS sizes everything in absolute pt, so scaling the
  // root font size does nothing — zoom is what actually re-flows the page.)
  scale: 1,
  minScale: 0.7,

  // Vertical rhythm, in px (scales with the font since the sheet is in px).
  headerGap: 18, // below the name/title header
  sectionGap: 16, // between sections
  entryGap: 12, // between timeline entries
  bulletGap: 3, // between bullets
  sidebarGap: 18, // between sidebar sections
  noteGap: 14, // around the "Visit linkedin…" / "Visit website…" notes

  // Force Education (and everything after it) onto page 2.
  educationPageBreak: true,
};

/* Print overrides layered on top of the site's own @media print block. The
   site CSS is tuned for a browser Cmd-P; here everything comes from DEFAULTS.
   Margins live in @page rather than page.pdf() because Chrome lets a CSS
   @page margin override the printToPDF margin options, not the other way. */
function fitCss(o) {
  return `
@media print {
  @page {
    size: A4;
    margin: ${o.marginTop}mm ${o.marginRight}mm ${o.marginBottom}mm ${o.marginLeft}mm;
  }
  .cv-sheet { padding: 0 !important; }
  .cv-section.cv-page-break-before {
    page-break-before: ${o.educationPageBreak ? "always" : "auto"} !important;
    break-before: ${o.educationPageBreak ? "page" : "auto"} !important;
    padding-top: 0 !important;
  }
  .cv-header { margin-bottom: ${o.headerGap}px; }
  .cv-section { margin-bottom: ${o.sectionGap}px; }
  .cv-entry { margin-bottom: ${o.entryGap}px; }
  .cv-entry-bullets li { margin-bottom: ${o.bulletGap}px; }
  .cv-sidebar-section { margin-bottom: ${o.sidebarGap}px; }
  .cv-footer-note, .cv-projects-note { margin: ${o.noteGap}px 0; }
}
`;
}

/* Chrome writes an uncompressed page tree, so /Count on the root Pages node
   is enough to know how many pages came out. */
function countPages(buf) {
  const counts = Buffer.from(buf).toString("latin1").match(/\/Count\s+(\d+)/g) || [];
  return counts.reduce((max, c) => Math.max(max, Number(c.split(/\s+/)[1])), 0);
}

const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function parseArgs(argv) {
  const positional = [];
  const opts = { ...DEFAULTS, pages: 2, fit: true };
  const numericFlags = new Map(
    Object.keys(DEFAULTS)
      .filter((k) => typeof DEFAULTS[k] === "number")
      .concat(["pages"])
      .map((k) => ["--" + kebab(k), k])
  );

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (numericFlags.has(a)) {
      opts[numericFlags.get(a)] = Number(argv[++i]);
    } else if (a === "--margin") {
      // Shorthand: set all four margins at once.
      const v = Number(argv[++i]);
      Object.assign(opts, {
        marginTop: v,
        marginBottom: v,
        marginLeft: v,
        marginRight: v,
      });
    } else if (a === "--no-fit") {
      opts.fit = false;
    } else if (a === "--no-education-page-break") {
      opts.educationPageBreak = false;
    } else if (a.startsWith("--")) {
      console.error(`Unknown flag: ${a}`);
      process.exit(1);
    } else {
      positional.push(a);
    }
  }
  return { positional, opts };
}

const USAGE = `Usage: node scripts/cv-to-pdf.js <cv-data.js> [output.pdf] [flags]

Layout flags (all values are numbers; defaults in brackets):
  --margin N                  all four margins, mm            [-]
  --margin-top N              top margin, mm                  [${DEFAULTS.marginTop}]
  --margin-bottom N           bottom margin, mm               [${DEFAULTS.marginBottom}]
  --margin-left N             left margin, mm                 [${DEFAULTS.marginLeft}]
  --margin-right N            right margin, mm                [${DEFAULTS.marginRight}]
  --scale N                   content zoom, 1 = as designed   [${DEFAULTS.scale}]
  --min-scale N               auto-fit shrink floor           [${DEFAULTS.minScale}]
  --header-gap N              space below header, px          [${DEFAULTS.headerGap}]
  --section-gap N             space between sections, px      [${DEFAULTS.sectionGap}]
  --entry-gap N               space between entries, px       [${DEFAULTS.entryGap}]
  --bullet-gap N              space between bullets, px       [${DEFAULTS.bulletGap}]
  --sidebar-gap N             space between sidebar blocks,px [${DEFAULTS.sidebarGap}]
  --note-gap N                space around footer notes, px   [${DEFAULTS.noteGap}]

Behaviour flags:
  --pages N                   page budget for auto-fit        [2]
  --no-fit                    skip the shrink-to-fit loop
  --no-education-page-break   let Education flow inline instead of starting page 2
`;

async function main() {
  const { positional, opts } = parseArgs(process.argv.slice(2));
  if (!positional[0]) {
    console.error(USAGE);
    process.exit(1);
  }

  const dataPath = path.resolve(process.cwd(), positional[0]);
  const cv = require(dataPath);

  // Default output: <folder>/<folder-name>.pdf, e.g.
  // applications/2026-07-21-digitalscience-senior-ui-engineer.pdf
  const dataDir = path.dirname(dataPath);
  const outPath = positional[1]
    ? path.resolve(process.cwd(), positional[1])
    : path.join(dataDir, `${path.basename(dataDir)}.pdf`);

  const layout = fs.readFileSync(
    path.join(root, "src/_includes/layouts/cv.njk"),
    "utf8"
  );
  const cvPage = fs.readFileSync(path.join(root, "src/cv.njk"), "utf8");

  // Pull out just the renderCV macro definition from src/cv.njk.
  const macroMatch = cvPage.match(/{% macro renderCV\(cv\) %}[\s\S]*?{% endmacro %}/);
  if (!macroMatch) {
    console.error("Could not find renderCV macro in src/cv.njk");
    process.exit(1);
  }

  const body = `${macroMatch[0]}\n<div class="cv-page">{{ renderCV(cv) }}</div>`;
  const combined = layout
    .replace("{{ content | safe }}", body)
    .replace("</head>", `<style>${fitCss(opts)}</style>\n</head>`);

  const env = new nunjucks.Environment(null, { autoescape: false });
  const html = env.renderString(combined, { cv });

  const contentW = A4_W - (opts.marginLeft + opts.marginRight) * MM;
  const contentH = A4_H - (opts.marginTop + opts.marginBottom) * MM;

  const browser = await puppeteer.launch({ executablePath: CHROME });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: Math.round(contentW), height: Math.round(contentH) });
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("print");

    // Margins come from the @page rule in fitCss(); preferCSSPageSize makes
    // Chrome honour it instead of silently applying its own defaults.
    const pdfOptions = {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    };

    const setScale = (z) =>
      page.evaluate((z) => {
        let el = document.getElementById("cv-fit-style");
        if (!el) {
          el = document.createElement("style");
          el.id = "cv-fit-style";
          document.head.appendChild(el);
        }
        el.textContent = `@media print { .cv-page { zoom: ${z} } }`;
      }, z);

    // Shrink the content until the real PDF fits in opts.pages.
    let scale = opts.scale;
    await setScale(scale);
    let buf = await page.pdf(pdfOptions);
    let pages = countPages(buf);

    if (opts.fit) {
      while (pages > opts.pages && scale > opts.minScale) {
        scale = Math.round((scale - 0.02) * 100) / 100;
        await setScale(scale);
        buf = await page.pdf(pdfOptions);
        pages = countPages(buf);
      }
      if (pages > opts.pages) {
        console.warn(
          `warning: still ${pages} pages at the ${scale}× floor — trim the CV data`
        );
      }
      console.log(`fit: ${scale}× scale → ${pages} page(s)`);
    } else {
      console.log(`${scale}× scale → ${pages} page(s)`);
    }

    fs.writeFileSync(outPath, buf);
  } finally {
    await browser.close();
  }

  console.log(`PDF written to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
