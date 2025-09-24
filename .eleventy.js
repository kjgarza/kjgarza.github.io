module.exports = function(eleventyConfig) {
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
