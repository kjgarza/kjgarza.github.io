// /ask/ with Jev (typesafe-ai/jev): a decision model that picks among app-built
// candidates instead of writing JSON. A fake evaluator stands in for the Gateway.
const { describe, test, expect } = require("bun:test");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { buildAskData } = require("../lib/ask/site-data.js");
const { createAskCatalog, checkElement } = require("../lib/ask/catalog.mjs");
const { buildCandidates, createJevEngine, JEV_ANSWERS } = require("../lib/ask/jev.mjs");
const { createAskHandler } = require("../lib/ask/server.mjs");

const root = path.resolve(__dirname, "..");
const ORIGIN = "https://kjgarza.github.io";
const data = buildAskData();
const catalog = createAskCatalog(data);
const candidates = buildCandidates(data);

const gated = fs
  .readdirSync(path.join(root, "src/work"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => matter(fs.readFileSync(path.join(root, "src/work", f), "utf8")))
  .filter((cs) => cs.data.passwordProtected === true);

// Plays Jev: picks the root (or "unavailable"), uses the wanted candidates, keeps catalog order
const fakeJev = ({ wanted = [], unavailable = false, fail = false } = {}) => {
  const calls = [];
  const evaluate = async (request) => {
    calls.push(request);
    if (fail) throw new Error("Evaluation request failed (HTTP 500).");
    const answers = {};
    for (const [name, q] of Object.entries(request.questions)) {
      const keys = Object.keys(q.criteria);
      let choice;
      if (name === "root") choice = unavailable ? "unavailable" : keys.find((k) => k !== "unavailable");
      else if (name.startsWith("select_")) choice = keys.find((k) => wanted.includes(k.replace(/^use:/, ""))) ?? "omit";
      else choice = keys[0];
      answers[name] = { choice, confidence: 0.9 };
    }
    return { answers };
  };
  return { evaluate, calls };
};

const handlerWith = (jev) =>
  createAskHandler({
    engine: createJevEngine({ evaluate: jev.evaluate }),
    loadSiteData: async () => ({ data, llmsFull: "" }),
    allowedOrigins: [ORIGIN],
  });

const ask = async (handler, prompt) => {
  const res = await handler(
    new Request("https://ask.example.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: ORIGIN, "CF-Connecting-IP": "203.0.113.9" },
      body: JSON.stringify({ prompt }),
    })
  );
  return { res, lines: (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l)) };
};

// Replay patches into a spec, the way useUIStream does
const compile = (lines) => {
  const spec = { root: "", elements: {} };
  for (const p of lines) {
    if (p.path === "/root") spec.root = p.value;
    else spec.elements[p.path.split("/").pop()] = p.value;
  }
  return spec;
};
const rendered = (spec) => spec.elements[spec.root].children.map((k) => spec.elements[k]);

describe("candidates", () => {
  test("one per work item, publication, tool, role and public case-study section, plus root and contact", () => {
    const count = (type) => candidates.filter((c) => c.element.type === type).length;
    expect(count("WorkCard")).toBe(data.work.length);
    expect(count("Publication")).toBe(data.publications.length);
    expect(count("ToolCard")).toBe(data.tools.length);
    expect(count("Timeline")).toBe(data.roles.length);
    expect(count("CaseStudyExcerpt")).toBe(data.caseStudies.reduce((n, cs) => n + cs.sections.length, 0));
    expect(count("ContactCTA")).toBe(1);
    expect(candidates.filter((c) => c.root !== false).map((c) => c.element.type)).toEqual(["Stack"]);
  });
  test("ids are unique and match the composer's id rule", () => {
    const ids = candidates.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-zA-Z][\w-]*$/);
  });
  test("every candidate element is valid in the catalog", () => {
    for (const c of candidates) expect(checkElement(catalog, { ...c.element, children: [] }).ok, c.id).toBe(true);
  });
  test("descriptions sent to the evaluator carry no gated case-study content", () => {
    const sent = JSON.stringify(candidates.map((c) => c.description));
    expect(gated.length).toBeGreaterThan(0);
    for (const cs of gated) {
      const paragraphs = cs.content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 80 && !p.startsWith("#"));
      for (const p of paragraphs) expect(sent, cs.data.title).not.toContain(p.slice(0, 80));
    }
  });
});

describe("Jev engine", () => {
  test("streams a fixed answer followed by the chosen cards", async () => {
    const jev = fakeJev({ wanted: ["work-knowledge-graph-engine", "cs-datacite-usage-reports-api-overview", "contact"] });
    const { res, lines } = await ask(handlerWith(jev), "What have you done with knowledge graphs?");
    expect(res.status).toBe(200);
    const items = rendered(compile(lines));
    expect(items[0]).toEqual({ type: "Answer", props: { text: JEV_ANSWERS.found }, children: [] });
    expect(items.slice(1).map((e) => e.type)).toEqual(["WorkCard", "CaseStudyExcerpt", "ContactCTA"]);
    expect(items[1].props).toEqual({ id: "knowledge-graph-engine" });
    expect(jev.calls[0].state.user_request).toBe("What have you done with knowledge graphs?");
  });
  test("roles chosen separately merge into one Timeline, newest first", async () => {
    const jev = fakeJev({ wanted: ["role-datacite-2016", "role-digital-science-2024"] });
    const items = rendered(compile((await ask(handlerWith(jev), "Where have you worked?")).lines));
    const timelines = items.filter((e) => e.type === "Timeline");
    expect(timelines).toHaveLength(1);
    expect(timelines[0].props.roles).toEqual(["digital-science-2024", "datacite-2016"]);
  });
  test("an unavailable root becomes the not-in-portfolio answer and the contact button", async () => {
    const items = rendered(compile((await ask(handlerWith(fakeJev({ unavailable: true })), "What's your favourite pizza?")).lines));
    expect(items).toEqual([
      { type: "Answer", props: { text: JEV_ANSWERS.unavailable }, children: [] },
      { type: "ContactCTA", props: {}, children: [] },
    ]);
  });
  test("nothing chosen also falls back to not-in-portfolio", async () => {
    const items = rendered(compile((await ask(handlerWith(fakeJev({ wanted: [] })), "Have you worked in Antarctica?")).lines));
    expect(items[0].props.text).toBe(JEV_ANSWERS.unavailable);
  });
  test("an evaluator error streams the failure answer instead of breaking the page", async () => {
    const { res, lines } = await ask(handlerWith(fakeJev({ fail: true })), "Anything?");
    expect(res.status).toBe(200);
    expect(rendered(compile(lines))).toEqual([{ type: "Answer", props: { text: JEV_ANSWERS.failed }, children: [] }]);
  });
  test("every streamed patch passes the catalog filter", async () => {
    const jev = fakeJev({ wanted: candidates.slice(0, 12).map((c) => c.id) });
    const { lines } = await ask(handlerWith(jev), "Show me everything");
    for (const p of lines) if (p.path !== "/root") expect(checkElement(catalog, p.value).ok, p.path).toBe(true);
  });
});
