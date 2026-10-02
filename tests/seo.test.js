// SEO invariants checked against the built site (_site/).
// Builds once, then asserts on the rendered HTML — the same thing crawlers see.
const { describe, test, expect, beforeAll } = require("bun:test");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const out = path.join(root, "_site");
const SITE = "https://kjgarza.github.io";

const read = (urlPath) => {
  const rel = urlPath.replace(/^\//, "");
  const file = rel.endsWith(".html") || rel.endsWith(".xml") ? rel : path.join(rel, "index.html");
  return fs.readFileSync(path.join(out, file), "utf8");
};

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

const meta = (html, key) => {
  const m = html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)">`));
  return m ? decode(m[1]) : null;
};
const title = (html) => decode(html.match(/<title>([^<]*)<\/title>/)[1]);
const canonical = (html) => (html.match(/<link rel="canonical" href="([^"]*)">/g) || []).map((t) => t.match(/href="([^"]*)"/)[1]);
const count = (html, re) => (html.match(re) || []).length;
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const isNoindex = (html) => /<meta name="robots" content="noindex/.test(html);

let sitemapUrls = [];
const allHtml = [];

beforeAll(() => {
  execSync("bun run build", { cwd: root, stdio: "pipe" });
  const xml = fs.readFileSync(path.join(out, "sitemap.xml"), "utf8");
  sitemapUrls = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".html")) allHtml.push(p);
    }
  };
  walk(out);
}, 120000);

const htmlPages = () => sitemapUrls.filter((u) => u.endsWith("/"));

describe("canonical and og:url", () => {
  test("every sitemap page has one canonical equal to og:url, with no double slash", () => {
    for (const url of htmlPages()) {
      const html = read(url);
      const c = canonical(html);
      expect(c, url).toEqual([`${SITE}${url}`]);
      if (meta(html, "og:url") !== null) expect(meta(html, "og:url"), url).toBe(`${SITE}${url}`);
    }
  });
  test("CV page has a canonical and OG/Twitter tags", () => {
    const html = read("/cv/");
    expect(canonical(html)).toEqual([`${SITE}/cv/`]);
    expect(meta(html, "og:title")).toBeTruthy();
    expect(meta(html, "og:image")).toBeTruthy();
    expect(meta(html, "twitter:card")).toBe("summary_large_image");
  });
});

describe("meta escaping", () => {
  test("every meta tag with content is well-formed", () => {
    for (const url of htmlPages()) {
      const html = read(url);
      const tags = html.match(/<meta [^>]*content=[^>]*>/g) || [];
      for (const t of tags) expect(t, url).toMatch(/^<meta [a-z-]+="[^"]*" content="[^"]*">$|^<meta name="viewport"/);
    }
  });
  test("Repo Atlas description survives intact", () => {
    const src = fs.readFileSync(path.join(root, "src/work/repo-atlas-catalogue.md"), "utf8");
    const desc = src.match(/^description: (.*)$/m)[1].replace(/^["']|["']$/g, "");
    const html = read("/work/repo-atlas-catalogue/");
    expect(desc).toContain('"');
    expect(meta(html, "description")).toBe(desc);
    expect(meta(html, "og:description")).toBe(desc);
  });
});

describe("titles and headings", () => {
  test("homepage title names the role and the page has one H1", () => {
    const html = read("/");
    expect(title(html)).toBe("Kristian Garza — AI Engineer in Berlin");
    expect(count(html, /<h1[\s>]/g)).toBe(1);
  });
  test("every indexable page has exactly one H1", () => {
    for (const url of htmlPages()) expect(count(read(url), /<h1[\s>]/g), url).toBe(1);
  });
  test("index pages carry the site name in the title", () => {
    expect(title(read("/work/"))).toBe("Work — Kristian Garza");
    expect(title(read("/tools/"))).toBe("Tools — Kristian Garza");
    expect(title(read("/playground/"))).toBe("Playground — Kristian Garza");
    expect(title(read("/publications/"))).toBe("Publications — Kristian Garza");
  });
  test("index page cards are H2, not H3", () => {
    for (const url of ["/work/", "/tools/", "/playground/"]) expect(count(read(url), /<h3[\s>]/g), url).toBe(0);
  });
});

describe("meta descriptions", () => {
  test("site description fits in a search snippet", () => {
    const site = require(path.join(root, "src/_data/site.js"));
    expect(site.description.length).toBeGreaterThanOrEqual(120);
    expect(site.description.length).toBeLessThanOrEqual(160);
  });
  test("every indexable page has a unique description of at most 160 characters", () => {
    const seen = new Map();
    for (const url of htmlPages()) {
      const d = meta(read(url), "description");
      expect(d, url).toBeTruthy();
      expect(d.length, `${url}: ${d}`).toBeLessThanOrEqual(160);
      expect(seen.get(d), `${url} duplicates ${seen.get(d)}`).toBeUndefined();
      seen.set(d, url);
    }
  });
});

describe("CV", () => {
  const variants = ["iris", "anthro", "mistral"];
  test("/cv/ renders only the default CV", () => {
    const html = read("/cv/");
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(html).not.toContain("cv-variant-iris");
    expect(html).not.toMatch(/Iris AI|Mistral|Anthropic –/);
  });
  test("variants live on their own noindex pages, unlisted and unlinked", () => {
    for (const v of variants) {
      const html = read(`/cv/${v}/`);
      expect(isNoindex(html), v).toBe(true);
      expect(count(html, /<h1[\s>]/g)).toBe(1);
      expect(sitemapUrls).not.toContain(`/cv/${v}/`);
    }
    for (const file of allHtml) {
      const html = fs.readFileSync(file, "utf8");
      for (const v of variants) expect(html, file).not.toContain(`href="/cv/${v}/"`);
    }
  });
});

describe("gated case studies", () => {
  const gated = fs
    .readdirSync(path.join(root, "src/work"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => fs.readFileSync(path.join(root, "src/work", f), "utf8"))
    .filter((src) => /^passwordProtected: true$/m.test(src));

  test("there are gated case studies to check", () => expect(gated.length).toBeGreaterThan(0));
  test("a gated page is indexable only when it has a public summary", () => {
    for (const src of gated) {
      const url = src.match(/^permalink: (.*)$/m)[1].trim();
      const html = read(url);
      if (/^publicSummary:/m.test(src)) {
        expect(isNoindex(html), url).toBe(false);
        expect(sitemapUrls).toContain(url);
        expect(html).toContain('class="cs-public-summary');
      } else {
        expect(isNoindex(html), url).toBe(true);
        expect(sitemapUrls).not.toContain(url);
      }
    }
  });
  test("no sitemap page is noindex", () => {
    for (const url of htmlPages()) expect(isNoindex(read(url)), url).toBe(false);
  });
});

describe("structured data", () => {
  test("Person schema has a working image and a consistent job title", () => {
    const person = jsonLd(read("/")).find((s) => s["@type"] === "Person");
    expect(person.jobTitle).toBe("AI Engineer");
    expect(person.image.startsWith(`${SITE}/`)).toBe(true);
    expect(fs.existsSync(path.join(out, new URL(person.image).pathname))).toBe(true);
    expect(person["@id"]).toBe(`${SITE}/#person`);
  });
  test("homepage has WebSite schema", () => {
    const site = jsonLd(read("/")).find((s) => s["@type"] === "WebSite");
    expect(site.url).toBe(`${SITE}/`);
  });
  test("public case studies have CreativeWork schema pointing at the Person", () => {
    const html = read("/work/datacite-usage-reports-api/");
    const cw = jsonLd(html).find((s) => s["@type"] === "CreativeWork");
    expect(cw.name).toBeTruthy();
    expect(cw.description).toBeTruthy();
    expect(cw.url).toBe(`${SITE}/work/datacite-usage-reports-api/`);
    expect(cw.author["@id"]).toBe(`${SITE}/#person`);
  });
  test("publications page lists ScholarlyArticle entries", () => {
    const items = jsonLd(read("/publications/")).flatMap((s) => s["@graph"] || [s]);
    expect(items.filter((s) => s["@type"] === "ScholarlyArticle").length).toBeGreaterThan(0);
  });
});

describe("images and performance", () => {
  test("no images are hotlinked from Imgur", () => {
    for (const file of allHtml) expect(fs.readFileSync(file, "utf8"), file).not.toContain("i.imgur.com");
  });
  test("every <img> has alt, width and height", () => {
    for (const url of [...htmlPages(), "/cv/", "/404.html"]) {
      const imgs = read(url).match(/<img\b[^>]*>/g) || [];
      for (const img of imgs) {
        expect(img, url).toMatch(/\salt="/);
        expect(img, url).toMatch(/\swidth="\d+"/);
        expect(img, url).toMatch(/\sheight="\d+"/);
      }
    }
  });
  test("decorative arrow has empty alt", () => {
    expect(read("/")).toMatch(/<img src="\/drawings\/Arrow-new\.svg" alt=""/);
  });
  test("fonts are self-hosted and preloaded", () => {
    const html = read("/");
    expect(html).not.toContain("fonts.googleapis.com");
    expect(html).toContain('<link rel="preload" href="/assets/fonts/manrope-latin.woff2" as="font" type="font/woff2" crossorigin>');
    expect(fs.existsSync(path.join(out, "assets/fonts/manrope-latin.woff2"))).toBe(true);
  });
  test("gtag is not fetched during initial load", () => {
    expect(read("/")).not.toMatch(/<script async src="https:\/\/www\.googletagmanager\.com/);
  });
  test("work card images declare their displayed size", () => {
    expect(read("/work/")).toContain('sizes="576px"');
  });
});

describe("social previews and 404", () => {
  test("case studies with a hero image use it as og:image", () => {
    const html = read("/work/query-translation-api/");
    expect(meta(html, "og:image")).toBe(`${SITE}/assets/images/nl2query-hero.png`);
    expect(meta(html, "twitter:image")).toBe(`${SITE}/assets/images/nl2query-hero.png`);
  });
  test("a missing hero image falls back to the default og:image", () => {
    // knowledge-graph-engine-hero.png is referenced but not committed
    const html = read("/work/knowledge-graph-engine/");
    expect(meta(html, "og:image")).toBe(`${SITE}/assets/images/og-homepage.png`);
  });
  test("a custom 404 page exists and is noindex", () => {
    const html = read("/404.html");
    expect(isNoindex(html)).toBe(true);
    expect(count(html, /<h1[\s>]/g)).toBe(1);
    expect(sitemapUrls).not.toContain("/404.html");
  });
});
