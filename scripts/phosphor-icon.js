const fs = require("fs");

// Phosphor icons: inline the raw SVG at build time (no icon font/JS shipped).
// name: e.g. "linkedin-logo" — matches a file under @phosphor-icons/core/assets/regular
// size: pixel value used for both width and height (the site's Tailwind CSS is
//   pre-built/purged, so arbitrary w-*/h-* utility classes won't exist — set explicit attrs)
// attrs: extra raw attributes to splice onto the <svg> tag (e.g. an id for JS hooks, a class)
// Shared by .eleventy.js (as a shortcode) and scripts/cv-to-pdf.js (as a Nunjucks tag).
const phosphorIconCache = {};
function iconShortcode(name, size = 24, attrs = "") {
  if (!phosphorIconCache[name]) {
    const svgPath = require.resolve(`@phosphor-icons/core/assets/regular/${name}.svg`);
    phosphorIconCache[name] = fs.readFileSync(svgPath, "utf8");
  }
  let svg = phosphorIconCache[name];
  const extra = [`width="${size}" height="${size}"`, attrs].filter(Boolean).join(" ");
  svg = svg.replace("<svg ", `<svg ${extra} `);
  return svg;
}

module.exports = { iconShortcode };
