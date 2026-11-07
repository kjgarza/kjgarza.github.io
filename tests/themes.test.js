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
    const hrefs = [...section(readHome(theme), "work-heading").matchAll(/<p class="ed-row-title"><a href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBe(5);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/work\/[a-z0-9-]+\/$/);
      expect(fs.existsSync(path.join(outDir(theme), href, "index.html")), href).toBe(true);
    }
  });

  test.each(THEMES)("the %s homepage lists the five newest publications and links to all", (theme) => {
    const pubs = section(readHome(theme), "pubs-heading");
    const years = [...pubs.matchAll(/class="ed-row-year">(\d{4})</g)].map((m) => Number(m[1]));
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

// ── Subpages (issue #35) ────────────────────────────────────────────────────
const readPage = (theme, urlPath) => {
  const rel = urlPath.replace(/^\//, "");
  const file = rel.endsWith(".html") ? rel : path.join(rel, "index.html");
  return fs.readFileSync(path.join(outDir(theme), file), "utf8");
};
const workData = require(path.join(root, "src/_data/work.js"));
const featuredWork = workData.filter((w) => w.featured);

describe("work page", () => {
  test.each(THEMES)("the %s work page lists the featured items in data order", (theme) => {
    expect(headings(main(readPage(theme, "/work/")), 2)).toEqual(featuredWork.map((w) => w.title));
  });

  test.each(THEMES)("every published item on the %s work page links to a built case study", (theme) => {
    const page = main(readPage(theme, "/work/"));
    for (const item of featuredWork.filter((w) => w.status === "published")) {
      expect(page, item.id).toMatch(new RegExp(`href="${item.link}/?"`));
      expect(fs.existsSync(path.join(outDir(theme), item.link, "index.html")), item.link).toBe(true);
    }
  });

  test("only the accent work page shows screenshots", () => {
    expect(count(main(readPage("editorial", "/work/")), /<img\b/g)).toBe(0);
    const accentImgs = main(readPage("accent", "/work/")).match(/<img\b[^>]*>/g) || [];
    expect(accentImgs.length).toBe(featuredWork.filter((w) => w.image).length);
    for (const img of accentImgs) expect(img).toContain('sizes="576px"');
  });
});

const toolsData = require(path.join(root, "src/_data/tools.js"));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

describe("tools page", () => {
  test.each(THEMES)("the %s tools page lists every tool in data order", (theme) => {
    const names = headings(main(readPage(theme, "/tools/")), 2).map((h) => h.replace(/\s*↗$/, ""));
    expect(names).toEqual(toolsData.map((t) => t.name));
  });

  test.each(THEMES)("every tool on the %s tools page links to its URL", (theme) => {
    const page = main(readPage(theme, "/tools/"));
    for (const tool of toolsData) expect(page, tool.name).toMatch(new RegExp(`href="${escapeRe(tool.link)}"`));
  });

  test("only the accent tools page has tool icons and the \"used by\" doodle", () => {
    const editorial = main(readPage("editorial", "/tools/"));
    expect(count(editorial, /<img\b/g)).toBe(0);
    expect(editorial).not.toContain("used-by.svg");
    const accent = main(readPage("accent", "/tools/"));
    expect(accent).toContain("/drawings/used-by.svg");
    for (const tool of toolsData) expect(accent, tool.name).toContain(`src="${tool.image}"`);
  });
});

const pubsData = require(path.join(root, "src/_data/publications.js"));
const pubType = (url) =>
  url.includes("doi.org") ? "DOI" : url.includes("medium.com") ? "Blog" : url.includes("zenodo.org") ? "Zenodo" : "Article";
const pubLinks = (page) => [...page.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((m) => m[1]).filter((h) => pubsData.some((p) => p.id === h));

describe("publications page", () => {
  test.each(THEMES)("the %s publications page links to every publication exactly once", (theme) => {
    const links = pubLinks(main(readPage(theme, "/publications/")));
    expect(links.length).toBe(pubsData.length);
    expect(new Set(links).size).toBe(pubsData.length);
  });

  test.each(THEMES)("the %s publications page groups by year, newest first", (theme) => {
    const years = headings(main(readPage(theme, "/publications/")), 2).map(Number);
    const expected = [...new Set(pubsData.map((p) => p.publicationYear))].sort((a, b) => b - a);
    expect(years).toEqual(expected);
  });

  test("both themes list the publications in the same order", () => {
    expect(pubLinks(main(readPage("editorial", "/publications/")))).toEqual(pubLinks(main(readPage("accent", "/publications/"))));
  });

  test.each(THEMES)("source links on the %s publications page open in a new tab safely", (theme) => {
    const tags = main(readPage(theme, "/publications/")).match(/<a\b[^>]*>/g).filter((t) => pubsData.some((p) => t.includes(`href="${p.id}"`)));
    for (const tag of tags) {
      expect(tag).toContain('target="_blank"');
      expect(tag).toContain("noopener");
    }
  });

  test.each(THEMES)("the %s publications page names each publication's type", (theme) => {
    const page = text(main(readPage(theme, "/publications/")));
    for (const type of ["DOI", "Blog", "Zenodo", "Article"]) {
      const expected = pubsData.filter((p) => pubType(p.id) === type).length;
      expect(count(page, new RegExp(`\\b${type}\\b`, "g")), type).toBeGreaterThanOrEqual(expected);
    }
  });

  test("only the accent publications page uses coloured type badges", () => {
    const badges = /\bbg-(blue|green|purple|neutral)-50\b/g;
    expect(count(main(readPage("editorial", "/publications/")), badges)).toBe(0);
    expect(count(main(readPage("accent", "/publications/")), badges)).toBe(pubsData.length);
  });
});

describe("playground and 404", () => {
  test.each(THEMES)("the %s playground has one H1 and its coming-soon note", (theme) => {
    const page = readPage(theme, "/playground/");
    expect(headings(page, 1)).toEqual(["Playground"]);
    expect(text(main(page))).toMatch(/Coming soon/i);
  });

  test.each(THEMES)("the %s 404 has one H1 and links back into the site", (theme) => {
    const page = readPage(theme, "/404.html");
    expect(headings(page, 1)).toEqual(["Page not found"]);
    for (const href of ["/", "/work/", "/tools/", "/publications/"]) expect(main(page)).toContain(`href="${href}"`);
  });
});

describe("case studies", () => {
  const sources = fs
    .readdirSync(path.join(root, "src/work"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(root, "src/work", f), "utf8"));
  const field = (src, key) => src.match(new RegExp(`^${key}: ?(.*)$`, "m"))?.[1].trim().replace(/^["']|["']$/g, "");
  const tagsOf = (src) => {
    const inline = field(src, "tags");
    if (inline) return inline.replace(/^\[|\]$/g, "").split(",").map((t) => t.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    const block = src.match(/^tags:\s*\n((?:\s+-\s+.*\n)+)/m);
    return block ? block[1].split("\n").map((l) => l.replace(/^\s+-\s+/, "").trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
  };

  test("there are case studies to check", () => expect(sources.length).toBeGreaterThan(0));

  test.each(THEMES)("every %s case study's H1 is its title, with company and tags shown", (theme) => {
    for (const src of sources) {
      const url = field(src, "permalink");
      const page = readPage(theme, url);
      expect(headings(page, 1), url).toEqual([field(src, "title")]);
      const body = text(main(page));
      expect(body, url).toContain(field(src, "company"));
      for (const tag of tagsOf(src)) expect(body, `${url} tag ${tag}`).toContain(tag);
    }
  });

  test.each(THEMES)("gated %s case studies show the gate, and the public summary when set", (theme) => {
    const gated = sources.filter((src) => /^passwordProtected: true$/m.test(src));
    expect(gated.length).toBeGreaterThan(0);
    for (const src of gated) {
      const page = main(readPage(theme, field(src, "permalink")));
      expect(page).toContain('type="password"');
      if (/^publicSummary:/m.test(src)) expect(page).toContain("cs-public-summary");
    }
  });
});

describe("subpage scroll reveal", () => {
  const SUBPAGES = ["/work/", "/tools/", "/publications/", "/playground/"];

  test.each(THEMES)("every %s subpage section opts in to the reveal", (theme) => {
    for (const url of SUBPAGES) {
      const sections = main(readPage(theme, url)).match(/<section\b[^>]*>/g) || [];
      expect(sections.length, url).toBeGreaterThan(0);
      for (const tag of sections) expect(tag, url).toContain("data-reveal");
    }
  });

  test.each(THEMES)("nothing on a %s subpage is hidden in the server-rendered HTML, and the script loads", (theme) => {
    for (const url of [...SUBPAGES, "/404.html"]) {
      const page = readPage(theme, url);
      expect(main(page), url).not.toMatch(/style="[^"]*opacity:\s*0/);
      expect(main(page), url).not.toMatch(/<section\b[^>]*\shidden\b/);
      expect(page.match(/<html\b[^>]*>/)[0], url).not.toContain("reveal-ready");
      expect(page, url).toMatch(/<script defer src="\/assets\/js\/reveal\.js"><\/script>/);
    }
  });
});

describe("footer", () => {
  test.each(THEMES)("the %s footer links to the author's profiles on every page", (theme) => {
    const site = require(path.join(root, "src/_data/site.js"));
    for (const url of ["/", "/work/", "/publications/", "/404.html"]) {
      const footer = readPage(theme, url).match(/<footer\b[\s\S]*?<\/footer>/)[0];
      for (const href of [site.author.github, site.author.linkedin, site.author.figma]) expect(footer, url).toContain(`href="${href}"`);
    }
  });
});
