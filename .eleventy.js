const EleventyImage = require("@11ty/eleventy-img");
const site = require("./src/_data/site.js");
const iconShortcode = require("./lib/phosphor-icon.js");

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function unescapeAttr(str) {
  return String(str).replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

async function imageShortcode(src, alt, cls = "", loading = "lazy", fetchpriority = "", sizes = "(max-width: 640px) 100vw, 896px", widths = [320, 640, 960, 1280]) {
  if (/^https?:\/\//.test(src)) {
    const parts = [`src="${escapeAttr(src)}"`, `alt="${escapeAttr(alt)}"`];
    if (cls) parts.push(`class="${escapeAttr(cls)}"`);
    parts.push(`loading="${escapeAttr(loading)}"`, `decoding="async"`);
    if (fetchpriority) parts.push(`fetchpriority="${escapeAttr(fetchpriority)}"`);
    return `<img ${parts.join(" ")}>`;
  }

  try {
    let imageSrc = src.startsWith("/") ? `./src${src}` : src;
    let parsedWidths = Array.isArray(widths) ? widths : [320, 640, 960, 1280];
    let metadata = await EleventyImage(imageSrc, {
      widths: parsedWidths,
      formats: ["webp", "jpeg"],
      outputDir: "./_site/img/",
      urlPath: "/img/",
      cacheOptions: {
        duration: "1d",
        directory: ".cache",
      },
    });
    let attrs = {
      alt,
      class: cls,
      loading,
      decoding: "async",
      sizes,
    };
    if (fetchpriority) attrs.fetchpriority = fetchpriority;
    return EleventyImage.generateHTML(metadata, attrs);
  } catch(e) {
    // Fallback to plain img when optimization fails (e.g. unreachable external URLs)
    const parts = [`src="${src}"`, `alt="${alt}"`];
    if (cls) parts.push(`class="${cls}"`);
    parts.push(`loading="${loading}"`, `decoding="async"`);
    if (fetchpriority) parts.push(`fetchpriority="${fetchpriority}"`);
    return `<img ${parts.join(" ")}>`;
  }
}

module.exports = function(eleventyConfig) {
  // Image optimization shortcode
  eleventyConfig.addAsyncShortcode("image", imageShortcode);

  // Case-study markdown keeps plain ![alt](/assets/images/x.png) links so the
  // markdown mirrors stay readable; swap them for optimized <picture> markup in the HTML
  const caseStudyImg = /<img src="(\/assets\/images\/[^"]+\.(?:png|jpe?g|webp))" alt="([^"]*)">/g;
  eleventyConfig.addTransform("case-study-images", async function (content) {
    if (!(this.page.outputPath || "").endsWith(".html") || !caseStudyImg.test(content)) return content;
    caseStudyImg.lastIndex = 0;
    const matches = [...content.matchAll(caseStudyImg)];
    const pictures = await Promise.all(
      matches.map(([, src, alt]) =>
        imageShortcode(src, unescapeAttr(alt), "", "lazy", "", "(max-width: 672px) 100vw, 672px", [320, 672, 1344])
      )
    );
    let i = 0;
    return content.replace(caseStudyImg, () => pictures[i++]);
  });

  // Phosphor icon shortcode: {% icon "linkedin-logo" "w-6 h-6" %}
  eleventyConfig.addShortcode("icon", iconShortcode);

  // Copy static assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/drawings");
  eleventyConfig.addPassthroughCopy("src/_next");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy({ "src/static/api": "api" });

  // Watch for changes in CSS/JS files
  eleventyConfig.addWatchTarget("src/assets/");
  
  // Configure Nunjucks environment to not auto-escape
  // Configure Nunjucks environment to not auto-escape
  eleventyConfig.setNunjucksEnvironmentOptions({
    autoescape: false,
  });

  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Case study markdown sources, used to build /llms.txt, /llms-full.txt
  // and the per-page markdown mirrors for AI agents
  eleventyConfig.addCollection("caseStudies", (collectionApi) =>
    collectionApi.getFilteredByGlob("src/work/*.md")
  );

  // Absolute URLs for agent-facing endpoints (llms.txt, sitemap, robots)
  eleventyConfig.addFilter("absoluteUrl", (path) => new URL(path, site.url).href);
  // URL of a page's markdown mirror (see work-md.njk)
  eleventyConfig.addFilter(
    "mdMirrorUrl",
    (pageUrl) => new URL(`${pageUrl}${pageUrl.endsWith("/") ? "" : "/"}index.md`, site.url).href
  );

  // Set directories
  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html", "liquid"]
  };
};
