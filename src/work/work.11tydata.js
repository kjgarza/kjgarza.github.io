const fs = require("fs");
const path = require("path");

// Case studies only (the legacy src/work/case-studies/*.html exports have no layout)
const isCaseStudy = (data) => data.layout === "layouts/case-study.njk";
const absolute = (path, site) => new URL(path, site.url).href;

module.exports = {
  eleventyComputed: {
    // Drop a heroImage whose file is missing so pages don't advertise a 404 as og:image
    heroImage: (data) => {
      const hero = data.heroImage;
      if (!hero || /^https?:\/\//.test(hero) || fs.existsSync(path.join(__dirname, "..", hero))) return hero;
      console.warn(`[work] ${data.page.inputPath}: heroImage ${hero} not found, ignoring it`);
      return undefined;
    },
    // A gated case study shows ~100 words, so keep it out of search unless it
    // has a public summary rendered above the password gate
    noindex: (data) => data.noindex || (data.passwordProtected === true && !data.publicSummary),
    structuredData: (data) => {
      if (!isCaseStudy(data)) return data.structuredData;
      return {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: data.title,
        description: data.description,
        url: absolute(data.page.url, data.site),
        ...(data.heroImage && { image: absolute(data.heroImage, data.site) }),
        ...(data.tags && { keywords: data.tags.join(", ") }),
        ...(data.company && { sourceOrganization: { "@type": "Organization", name: data.company } }),
        author: { "@id": data.site.schema_org["@id"] },
      };
    },
  },
};
