// /ask/ registry: hand-written specs render to the site's own markup. No model call.
import { describe, test, expect, beforeAll } from "bun:test";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { renderToString } from "react-dom/server";
import { buildAskData } from "../lib/ask/site-data.js";
import { AskAnswer } from "../lib/ask/registry.jsx";

const root = path.resolve(import.meta.dir, "..");
const fixture = (name) => JSON.parse(fs.readFileSync(path.join(import.meta.dir, "fixtures/ask", name), "utf8"));
const data = buildAskData();
const render = (spec) => renderToString(<AskAnswer spec={spec} data={data} />);
const decode = (s) => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");

describe("registry", () => {
  const html = decode(render(fixture("answer-with-work.json")));
  const work = data.work.find((w) => w.id === "datacite-usage-reports-api");
  const pub = data.publications.find((p) => p.id === "https://doi.org/10.5438/vwp0-vz05");

  test("Answer renders the model's text", () => {
    expect(html).toContain("He has built LLM services and data infrastructure for research organisations.");
  });
  test("WorkCard renders the work.js title, company and case-study link", () => {
    expect(html).toContain(work.title);
    expect(html).toContain(work.company);
    expect(html).toContain(`href="${work.link}"`);
    expect(html).toContain("Read case study");
  });
  test("Publication renders the citation and links the DOI", () => {
    expect(html).toContain(pub.title);
    expect(html).toContain(`href="${pub.id}"`);
    expect(html).toContain(String(pub.publicationYear));
  });
  test("CaseStudyExcerpt renders the passage and links the case study", () => {
    expect(html).toContain("The Sashimi project");
    expect(html).toContain('href="/work/datacite-usage-reports-api/"');
  });
  test("Timeline renders the chosen roles only", () => {
    expect(html).toContain("AI Senior Software Engineer");
    expect(html).toContain("Product Designer");
    expect(html).not.toContain("PHP Developer");
  });
  test("ToolCard renders the tools.js entry", () => {
    expect(html).toContain("Technology Radar");
    expect(html).toContain('href="https://kjgarza.github.io/radar"');
  });
  test("ContactCTA is the site's Tally button", () => {
    expect(html).toContain('data-tally-open="3XjAKz"');
  });
  test("the refusal fixture renders only the answer and the contact button", () => {
    const refusal = decode(render(fixture("not-in-portfolio.json")));
    expect(refusal).toContain("That's not in my portfolio.");
    expect(refusal).toContain('data-tally-open="3XjAKz"');
    expect(refusal).not.toContain("Read case study");
  });
  test("an unknown id renders nothing instead of an invented card", () => {
    const spec = fixture("answer-with-work.json");
    spec.elements["work-1"].props.id = "made-up-project";
    const out = render(spec);
    expect(out).not.toContain("made-up-project");
    expect(out).not.toContain("Read case study");
  });
  test("model text is escaped, not injected as HTML", () => {
    const spec = fixture("not-in-portfolio.json");
    spec.elements.answer.props.text = '<img src=x onerror="alert(1)">';
    expect(render(spec)).not.toContain("<img");
  });
  // Tailwind compiles site.css from the classes it finds in src/ and lib/ask/
  let css = "";
  beforeAll(() => {
    execSync("bun run build", { cwd: root, stdio: "pipe" });
    css = fs.readFileSync(path.join(root, "_site/assets/css/site.css"), "utf8");
  }, 120000);
  test("every class the registry renders gets CSS from the site build", () => {
    // Tailwind escapes : [ ] % / . in selectors
    const escape = (c) => c.replace(/([:\[\]%\/.!])/g, "\\$1");
    const classes = new Set([...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/).filter(Boolean)));
    const missing = [...classes].filter((c) => !css.includes(`.${escape(c)}`));
    expect(missing).toEqual([]);
  });
});
