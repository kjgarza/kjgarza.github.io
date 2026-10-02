// JSON-LD for /publications/: DOI-registered items are ScholarlyArticles, the rest blog posts
module.exports = {
  eleventyComputed: {
    structuredData: (data) => ({
      "@context": "https://schema.org",
      "@graph": data.publications.map((pub) => ({
        "@type": pub.id.includes("doi.org") ? "ScholarlyArticle" : "BlogPosting",
        "@id": pub.id,
        url: pub.id,
        headline: pub.title.trim(),
        datePublished: String(pub.publicationYear),
        author: { "@id": data.site.schema_org["@id"] },
      })),
    }),
  },
};
