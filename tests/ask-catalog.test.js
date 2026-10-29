// /ask/ catalog: the model picks components and IDs, the site data renders them.
// Checks the ID enums generated from src/_data/ and that specs outside them fail validation.
const { describe, test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { buildAskData } = require("../lib/ask/site-data.js");
const { createAskCatalog, validateAskSpec, ANSWER_MAX_CHARS } = require("../lib/ask/catalog.mjs");

const root = path.resolve(__dirname, "..");
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/ask", name), "utf8"));
const work = require(path.join(root, "src/_data/work.js"));
const publications = require(path.join(root, "src/_data/publications.js"));

const caseStudies = fs
  .readdirSync(path.join(root, "src/work"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => matter(fs.readFileSync(path.join(root, "src/work", f), "utf8")));
const gated = caseStudies.filter((cs) => cs.data.passwordProtected === true);
const slugOf = (cs) => cs.data.permalink.split("/").filter(Boolean).pop();

const data = buildAskData();
const catalog = createAskCatalog(data);

// Replace one element's props in a copy of the fixture spec
const withProps = (key, props) => {
  const spec = fixture("answer-with-work.json");
  spec.elements[key].props = props;
  return spec;
};

describe("ask data (generated from src/_data/)", () => {
  test("lists every work item and publication by id", () => {
    expect(data.work.map((w) => w.id)).toEqual(work.map((w) => w.id));
    expect(data.publications.map((p) => p.id)).toEqual(publications.map((p) => p.id));
  });
  test("tools and roles get stable slug ids", () => {
    expect(data.tools.map((t) => t.id)).toContain("technology-radar");
    expect(data.roles.map((r) => r.id)).toEqual(["digital-science-2024", "datacite-2020", "datacite-2016", "datamine-2011"]);
  });
  test("there are gated case studies to exclude", () => expect(gated.length).toBeGreaterThan(0));
  test("case studies leave out password-protected ones entirely", () => {
    const slugs = data.caseStudies.map((cs) => cs.slug);
    expect(slugs).toContain("datacite-usage-reports-api");
    for (const cs of gated) expect(slugs).not.toContain(slugOf(cs));
  });
  test("no gated case-study body text appears anywhere in the data", () => {
    const json = JSON.stringify(data);
    for (const cs of gated) {
      const paragraphs = cs.content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 80 && !p.startsWith("#"));
      expect(paragraphs.length).toBeGreaterThan(0);
      for (const p of paragraphs) expect(json, slugOf(cs)).not.toContain(p.slice(0, 80));
    }
  });
  test("case-study sections come from H2 headings, with a short excerpt", () => {
    const cs = data.caseStudies.find((c) => c.slug === "datacite-usage-reports-api");
    const overview = cs.sections.find((s) => s.id === "overview");
    expect(overview.heading).toBe("Overview");
    expect(overview.excerpt).toStartWith("The Sashimi project");
    expect(overview.excerpt.length).toBeLessThanOrEqual(400);
    expect(cs.url).toBe("/work/datacite-usage-reports-api/");
  });
});

describe("catalog validation", () => {
  test("the fixture specs are valid", () => {
    for (const name of ["answer-with-work.json", "not-in-portfolio.json"]) {
      const result = validateAskSpec(catalog, fixture(name));
      expect(result.issues, name).toEqual([]);
      expect(result.success, name).toBe(true);
    }
  });
  test("an unknown work id fails", () => {
    expect(validateAskSpec(catalog, withProps("work-1", { id: "made-up-project" })).success).toBe(false);
  });
  test("an unknown publication or tool id fails", () => {
    expect(validateAskSpec(catalog, withProps("pub-1", { id: "https://doi.org/10.0000/fake" })).success).toBe(false);
    expect(validateAskSpec(catalog, withProps("tool-1", { id: "imaginary-tool" })).success).toBe(false);
  });
  test("a protected case-study slug fails", () => {
    for (const cs of gated) {
      expect(validateAskSpec(catalog, withProps("excerpt-1", { slug: slugOf(cs), section: "overview" })).success, slugOf(cs)).toBe(false);
    }
  });
  test("a section that isn't in that case study fails", () => {
    expect(validateAskSpec(catalog, withProps("excerpt-1", { slug: "datacite-usage-reports-api", section: "secret-plans" })).success).toBe(false);
  });
  test("over-length Answer text fails", () => {
    expect(validateAskSpec(catalog, withProps("answer", { text: "x".repeat(ANSWER_MAX_CHARS + 1) })).success).toBe(false);
    expect(validateAskSpec(catalog, withProps("answer", { text: "x".repeat(ANSWER_MAX_CHARS) })).success).toBe(true);
  });
  test("an unknown role id or component type fails", () => {
    expect(validateAskSpec(catalog, withProps("roles", { roles: ["acme-1999"] })).success).toBe(false);
    const spec = fixture("not-in-portfolio.json");
    spec.elements.cta.type = "Iframe";
    expect(validateAskSpec(catalog, spec).success).toBe(false);
  });
  test("a child key with no element fails", () => {
    const spec = fixture("not-in-portfolio.json");
    spec.elements.main.children.push("ghost");
    expect(validateAskSpec(catalog, spec).success).toBe(false);
  });
  test("the prompt lists every component and the real ids", () => {
    const prompt = catalog.prompt();
    for (const c of ["Stack", "Answer", "WorkCard", "Publication", "CaseStudyExcerpt", "Timeline", "ToolCard", "ContactCTA"]) {
      expect(prompt).toContain(c);
    }
    expect(prompt).toContain("datacite-usage-reports-api");
  });
});
