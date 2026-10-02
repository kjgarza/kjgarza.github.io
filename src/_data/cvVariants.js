// Employer-specific CV variants, each rendered at /cv/<id>/ by src/cv-variants.njk.
// dataKey names the global data file (src/_data/<dataKey>.js) holding the CV.
module.exports = [
  { id: "iris", dataKey: "cvIris" },
  { id: "anthro", dataKey: "cvAnthro" },
  { id: "mistral", dataKey: "cvMistral" },
];
