// Build-time homepage themes (issue #33).
// Builds the site once per theme into its own folder, then asserts on the
// rendered HTML, the same seam as seo.test.js.
const { describe, test, expect, beforeAll } = require("bun:test");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const THEMES = ["editorial", "accent"];
const DISPLAY_FONT = {
  editorial: "/assets/fonts/playfair-display-latin.woff2",
  accent: "/assets/fonts/fraunces-latin.woff2",
};
const outDir = (theme) => path.join(root, ".cache", `theme-test-${theme}`);

const build = (theme, output) =>
  spawnSync("bun", ["x", "@11ty/eleventy", `--output=${output}`], {
    cwd: root,
    env: { ...process.env, SITE_THEME: theme },
    encoding: "utf8",
  });

const html = {};
const readHome = (theme) => html[theme];

beforeAll(() => {
  for (const theme of THEMES) {
    const res = build(theme, outDir(theme));
    if (res.status !== 0) throw new Error(`build failed for ${theme}:\n${res.stderr}`);
    html[theme] = fs.readFileSync(path.join(outDir(theme), "index.html"), "utf8");
  }
}, 180000);

const text = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, " ").trim();
const headings = (page, level) =>
  [...page.matchAll(new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, "g"))].map((m) => text(m[1]));
const count = (s, re) => (s.match(re) || []).length;
const main = (page) => page.match(/<main\b[\s\S]*<\/main>/)[0];
const talks = require(path.join(root, "src/_data/talks.js"));
const awards = require(path.join(root, "src/_data/awards.js"));

describe("homepage sections", () => {
  test.each(THEMES)("the %s homepage has its sections in order", (theme) => {
    const expected = [
      "About",
      "Worked with",
      "Case studies",
      "Useful things I've built",
      "Technology Radar",
      "Publications",
      ...(talks.length ? ["Talks"] : []),
      ...(awards.length ? ["Awards & affiliations"] : []),
      "Get in touch",
    ];
    expect(headings(main(readHome(theme)), 2)).toEqual(expected);
  });

  const section = (page, headingId) => {
    const m = main(page).match(new RegExp(`<section\\b[^>]*aria-labelledby="${headingId}"[\\s\\S]*?</section>`));
    if (!m) throw new Error(`no section labelled by #${headingId}`);
    return m[0];
  };

  test.each(THEMES)("the %s logo row names the four organisations", (theme) => {
    const imgs = [...section(readHome(theme), "worked-with").matchAll(/<img\b[^>]*\balt="([^"]*)"/g)].map((m) => m[1]);
    expect(imgs).toEqual(["Digital Science", "DataCite", "Make Data Count", "Research Data Alliance"]);
  });

  test.each(THEMES)("every %s case-study row links to a built case-study page", (theme) => {
    const hrefs = [...section(readHome(theme), "work-heading").matchAll(/<p class="home-row-title"><a href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBe(5);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/work\/[a-z0-9-]+\/$/);
      expect(fs.existsSync(path.join(outDir(theme), href, "index.html")), href).toBe(true);
    }
  });

  test.each(THEMES)("the %s homepage lists the five newest publications and links to all", (theme) => {
    const pubs = section(readHome(theme), "pubs-heading");
    const years = [...pubs.matchAll(/class="home-row-year">(\d{4})</g)].map((m) => Number(m[1]));
    expect(years).toEqual([2023, 2023, 2023, 2023, 2023]);
    expect(pubs).toContain('href="/publications/"');
  });

  test("only the accent theme shows case-study thumbnails", () => {
    const thumbs = (theme) => count(section(readHome(theme), "work-heading"), /<img\b/g);
    expect(thumbs("accent")).toBe(5);
    expect(thumbs("editorial")).toBe(0);
  });

  test("the editorial hero's H1 is the name; the accent hero's H1 is the headline", () => {
    expect(headings(readHome("editorial"), 1)).toEqual(["Kristian Garza"]);
    expect(headings(readHome("accent"), 1)[0]).toMatch(/^Solving complex problems, identifying smart solutions, in open science/);
  });
});

describe("scroll reveal (progressive enhancement)", () => {
  test.each(THEMES)("every %s homepage section opts in to the reveal", (theme) => {
    const sections = main(readHome(theme)).match(/<section\b[^>]*>/g);
    expect(sections.length).toBeGreaterThanOrEqual(7);
    for (const tag of sections) expect(tag).toContain("data-reveal");
  });

  test.each(THEMES)("nothing on the %s homepage is hidden in the server-rendered HTML", (theme) => {
    const m = main(readHome(theme));
    expect(m).not.toMatch(/style="[^"]*opacity:\s*0/);
    expect(m).not.toMatch(/<section\b[^>]*\shidden\b/);
    expect(readHome(theme).match(/<html\b[^>]*>/)[0]).not.toContain("reveal-ready");
  });

  test.each(THEMES)("the %s homepage loads the reveal script deferred", (theme) => {
    expect(readHome(theme)).toMatch(/<script defer src="\/assets\/js\/reveal\.js"><\/script>/);
    expect(fs.existsSync(path.join(outDir(theme), "assets/js/reveal.js"))).toBe(true);
  });

  test("the reveal mode follows the theme", () => {
    const mode = (theme) => readHome(theme).match(/data-reveal-mode="([a-z]+)"/)?.[1];
    expect(mode("editorial")).toBe("section");
    expect(mode("accent")).toBe("stagger");
  });
});

describe("theme selection", () => {
  test("an unknown theme fails the build and names the valid themes", () => {
    const res = build("bogus", path.join(root, ".cache", "theme-test-bogus"));
    expect(res.status).not.toBe(0);
    const output = res.stdout + res.stderr;
    expect(output).toContain("bogus");
    for (const t of THEMES) expect(output).toContain(t);
  }, 60000);

  test.each(THEMES)("the %s build links its own theme stylesheet", (theme) => {
    const links = [...readHome(theme).matchAll(/<link rel="stylesheet" href="([^"?]+)/g)].map((m) => m[1]);
    expect(links).toContain(`/assets/css/themes/${theme}.css`);
    for (const other of THEMES.filter((t) => t !== theme)) expect(links).not.toContain(`/assets/css/themes/${other}.css`);
    expect(fs.existsSync(path.join(outDir(theme), `assets/css/themes/${theme}.css`))).toBe(true);
  });

  test.each(THEMES)("the %s build preloads only its own display font", (theme) => {
    const preloads = [...readHome(theme).matchAll(/<link rel="preload" href="([^"]+\.woff2)"/g)].map((m) => m[1]);
    const own = DISPLAY_FONT[theme];
    expect(preloads).toContain(own);
    expect(fs.existsSync(path.join(outDir(theme), own))).toBe(true);
    for (const other of THEMES.filter((t) => t !== theme)) expect(preloads).not.toContain(DISPLAY_FONT[other]);
  });

  test.each(THEMES)("the %s homepage loads no third-party fonts, even from its stylesheets", (theme) => {
    const page = readHome(theme);
    expect(page).not.toContain("fonts.googleapis.com");
    const sheets = [...page.matchAll(/<link rel="stylesheet" href="(\/[^"?]+)/g)].map((m) => m[1]);
    for (const href of sheets) {
      const css = fs.readFileSync(path.join(outDir(theme), href), "utf8");
      expect(css, href).not.toContain("fonts.googleapis.com");
    }
  });

  test.each(THEMES)("the %s build marks the root element with its theme", (theme) => {
    const rootTag = readHome(theme).match(/<html\b[^>]*>/)[0];
    expect(rootTag).toContain(`data-site-theme="${theme}"`);
  });
});
