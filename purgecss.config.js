
module.exports = {
  content: ['**/*.html'], // Specify the files to be scanned for CSS classes
  css: ['main.css', 'ubuild.css', 'build/css/variables.css'], // Specify the CSS files to be purged
  // safelist: [], // Specify any CSS classes that should not be purged
  variables: true,
  rejectedCss: true,
  // Other configuration options...
};
