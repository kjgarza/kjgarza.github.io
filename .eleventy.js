const EleventyImage = require("@11ty/eleventy-img");

function escapeAttr(str) {
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function imageShortcode(src, alt, cls = "", loading = "lazy", fetchpriority = "", sizes = "(max-width: 640px) 100vw, 896px", widths = [320, 640, 1280]) {
  if (/^https?:\/\//.test(src)) {
    const parts = [`src="${escapeAttr(src)}"`, `alt="${escapeAttr(alt)}"`];
    if (cls) parts.push(`class="${escapeAttr(cls)}"`);
    parts.push(`loading="${escapeAttr(loading)}"`, `decoding="async"`);
    if (fetchpriority) parts.push(`fetchpriority="${escapeAttr(fetchpriority)}"`);
    return `<img ${parts.join(" ")}>`;
  }

  try {
    let imageSrc = src.startsWith("/") ? `./src${src}` : src;
    let parsedWidths = Array.isArray(widths) ? widths : [320, 640, 1280];
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
