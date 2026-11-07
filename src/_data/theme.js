// Build-time site theme (issue #33). Pick one with SITE_THEME when building:
//   SITE_THEME=editorial bun run build
// Every difference between the themes lives here (layout switches) or in
// src/assets/css/themes/<name>.css (colour, font, label, rule, logo-filter and
// feature-block and case-study tokens). Section markup is shared; partials
// read these switches for their few variations. pageStyle is the only switch
// the subpages (work, tools, publications, playground, 404) and the footer read;
// projectThumbnails also applies to the Work page. The rest are homepage-only.
const THEMES = {
  // Direction A: quiet and monochrome, serif display, grey logos.
  editorial: {
    name: "editorial",
    pageStyle: "editorial", // subpages: page header, hairline rows, serif titles
    heroStyle: "profile", // name + monogram, role line, focus chips
    projectThumbnails: false,
    ctaStyle: "link",
    reveal: "section",
    displayFont: { family: "Playfair Display", file: "/assets/fonts/playfair-display-latin.woff2", weight: "400 700" },
  },
  // Direction B: the same structure, keeps the brand pink and one doodle.
  accent: {
    name: "accent",
    pageStyle: "cards", // subpages: the card layouts (work grid, tilted tool cards, badges)
    heroStyle: "headline", // "Solving complex problems…" with doodles
    projectThumbnails: true,
    ctaStyle: "button",
    reveal: "stagger",
    displayFont: { family: "Fraunces", file: "/assets/fonts/fraunces-latin.woff2", weight: "300 700" },
  },
};

const DEFAULT_THEME = "accent";

module.exports = () => {
  const requested = (process.env.SITE_THEME || DEFAULT_THEME).trim();
  const theme = THEMES[requested];
  if (!theme) {
    throw new Error(
      `Unknown SITE_THEME "${requested}". Valid themes: ${Object.keys(THEMES).join(", ")}.`
    );
  }
  return theme;
};
