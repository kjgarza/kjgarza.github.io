// Phosphor icons: inline the raw SVG at build time (no icon font/JS shipped).
// Shared by .eleventy.js (as the `icon` shortcode) and scripts/cv-to-pdf.js.
// name: e.g. "linkedin-logo" — matches a file under @phosphor-icons/core/assets/regular
// size: pixel value used for both width and height (the site's Tailwind CSS is
//   pre-built/purged, so arbitrary w-*/h-* utility classes won't exist — set explicit attrs)
// attrs: extra raw attributes to splice onto the <svg> tag (e.g. an id for JS hooks, a class)
const fs = require("fs");

const cache = {};

module.exports = function phosphorIcon(name, size = 24, attrs = "") {
  if (!cache[name]) {
    const svgPath = require.resolve(`@phosphor-icons/core/assets/regular/${name}.svg`);
    cache[name] = fs.readFileSync(svgPath, "utf8");
  }
  const extra = [`width="${size}" height="${size}"`, attrs].filter(Boolean).join(" ");
  return cache[name].replace("<svg ", `<svg ${extra} `);
};
