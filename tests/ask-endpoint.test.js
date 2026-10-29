// /ask/ endpoint: what it refuses, what it accepts, and what it streams back.
// The model is a mock; no test calls a live model or the network.
const { describe, test, expect, beforeAll } = require("bun:test");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { MockLanguageModelV4 } = require("ai/test");
const { simulateReadableStream } = require("ai");
const { buildAskData } = require("../lib/ask/site-data.js");
const { createAskHandler, buildGrounding } = require("../lib/ask/server.mjs");

const root = path.resolve(__dirname, "..");
const ORIGIN = "https://kjgarza.github.io";
const data = buildAskData();
let llmsFull = "";

const gated = fs
  .readdirSync(path.join(root, "src/work"))
  .filter((f) => f.endsWith(".md"))
  .map((f) => matter(fs.readFileSync(path.join(root, "src/work", f), "utf8")))
  .filter((cs) => cs.data.passwordProtected === true);

beforeAll(() => {
  execSync("bun run build", { cwd: root, stdio: "pipe" });
  llmsFull = fs.readFileSync(path.join(root, "_site/llms-full.txt"), "utf8");
}, 120000);

// A mock model that streams the given JSONL lines as text, split mid-line to mimic token chunks
const mockModel = (lines) => {
  const text = lines.map((l) => (typeof l === "string" ? l : JSON.stringify(l))).join("\n") + "\n";
  const deltas = text.match(/[\s\S]{1,17}/g);
  return new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "t" },
          ...deltas.map((delta) => ({ type: "text-delta", id: "t", delta })),
          { type: "text-end", id: "t" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: "end_turn" },
            usage: {
              inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 10, text: 10, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
};

const VALID = [
  { op: "add", path: "/root", value: "main" },
  { op: "add", path: "/elements/main", value: { type: "Stack", props: {}, children: ["answer", "work-1"] } },
  { op: "add", path: "/elements/answer", value: { type: "Answer", props: { text: "Yes, at DataCite." }, children: [] } },
  { op: "add", path: "/elements/work-1", value: { type: "WorkCard", props: { id: "datacite-usage-reports-api" }, children: [] } },
];

const handlerWith = (opts = {}) => {
  const model = opts.model || mockModel(VALID);
  const handler = createAskHandler({
    model,
    loadSiteData: async () => ({ data, llmsFull }),
    allowedOrigins: [ORIGIN],
    rateLimit: { limit: 5, windowMs: 60_000 },
    ...opts,
  });
  return { handler, model };
};

const ask = (handler, { prompt = "Has he built APIs for research data?", origin = ORIGIN, ip = "203.0.113.1", method = "POST", body } = {}) =>
  handler(
    new Request("https://ask.example.dev/", {
      method,
      headers: { "Content-Type": "application/json", ...(origin && { Origin: origin }), "CF-Connecting-IP": ip },
      ...(method === "POST" && { body: body ?? JSON.stringify({ prompt }) }),
    })
  );

const lines = async (res) => (await res.text()).split("\n").filter(Boolean).map((l) => JSON.parse(l));

describe("grounding", () => {
  test("includes public case studies and the id lists", () => {
    const g = buildGrounding({ data, llmsFull });
    expect(g).toContain("The Sashimi project");
    expect(g).toContain("datacite-usage-reports-api");
    expect(g).toContain("digital-science-2024");
  });
  test("contains no content from password-protected case studies", () => {
    const g = buildGrounding({ data, llmsFull });
    expect(gated.length).toBeGreaterThan(0);
    for (const cs of gated) {
      const paragraphs = cs.content.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 80 && !p.startsWith("#"));
      for (const p of paragraphs) expect(g, cs.data.title).not.toContain(p.slice(0, 80));
    }
  });
});

describe("CORS", () => {
  test("preflight from the site origin is allowed", async () => {
    const { handler } = handlerWith();
    const res = await ask(handler, { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
  });
  test("other origins are rejected before the model is called", async () => {
    const { handler, model } = handlerWith();
    for (const origin of ["https://evil.example", null]) {
      const res = await ask(handler, { origin });
      expect(res.status, String(origin)).toBe(403);
      expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
    }
    expect((await ask(handler, { method: "OPTIONS", origin: "https://evil.example" })).status).toBe(403);
    expect(model.doStreamCalls.length).toBe(0);
  });
});

describe("rate limit", () => {
  test("trips after N requests from one IP, other IPs unaffected", async () => {
    const { handler } = handlerWith({ model: mockModel(VALID) });
    for (let i = 0; i < 5; i++) {
      const res = await ask(handler);
      expect(res.status, `request ${i + 1}`).toBe(200);
      await res.text();
    }
    const blocked = await ask(handler);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect((await ask(handler, { ip: "198.51.100.7" })).status).toBe(200);
  });
  test("the window resets", async () => {
    let t = 0;
    const { handler } = handlerWith({ rateLimit: { limit: 1, windowMs: 1000 }, now: () => t });
    expect((await ask(handler)).status).toBe(200);
    expect((await ask(handler)).status).toBe(429);
    t = 1001;
    expect((await ask(handler)).status).toBe(200);
  });
});

describe("requests", () => {
  test("rejects non-POST, missing, empty and over-long questions", async () => {
    const { handler, model } = handlerWith();
    expect((await ask(handler, { method: "GET" })).status).toBe(405);
    expect((await ask(handler, { body: "not json" })).status).toBe(400);
    expect((await ask(handler, { body: JSON.stringify({}) })).status).toBe(400);
    expect((await ask(handler, { prompt: "  " })).status).toBe(400);
    expect((await ask(handler, { prompt: "x".repeat(301) })).status).toBe(400);
    expect(model.doStreamCalls.length).toBe(0);
  });
  test("a valid question streams JSONL patches with CORS headers", async () => {
    const { handler } = handlerWith();
    const res = await ask(handler);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(ORIGIN);
    expect(await lines(res)).toEqual(VALID);
  });
  test("the model gets the catalog prompt and grounding as a cached system message, with capped output", async () => {
    const { handler, model } = handlerWith();
    await (await ask(handler, { prompt: "What has he done with knowledge graphs?" })).text();
    const call = model.doStreamCalls[0];
    const system = call.prompt.find((m) => m.role === "system");
    expect(system.content).toContain("AVAILABLE COMPONENTS");
    expect(system.content).toContain("The Sashimi project");
    expect(system.content).toMatch(/not in (my|the) portfolio/i);
    expect(system.providerOptions.anthropic.cacheControl).toEqual({ type: "ephemeral" });
    const user = call.prompt.find((m) => m.role === "user");
    expect(JSON.stringify(user.content)).toContain("What has he done with knowledge graphs?");
    expect(call.maxOutputTokens).toBeGreaterThan(0);
    expect(call.maxOutputTokens).toBeLessThanOrEqual(2000);
  });
});

describe("output filter: the model picks, the data renders", () => {
  test("drops elements with invented ids, unknown types, state and other paths", async () => {
    const bad = [
      ...VALID,
      { op: "add", path: "/elements/fake", value: { type: "WorkCard", props: { id: "made-up-project" }, children: [] } },
      { op: "add", path: "/elements/frame", value: { type: "Iframe", props: { src: "https://evil.example" }, children: [] } },
      { op: "add", path: "/elements/long", value: { type: "Answer", props: { text: "x".repeat(5000) }, children: [] } },
      { op: "add", path: "/state/items", value: [] },
      { op: "remove", path: "/elements/answer" },
      "this line is not JSON",
      "```",
    ];
    const { handler } = handlerWith({ model: mockModel(bad) });
    expect(await lines(await ask(handler))).toEqual(VALID);
  });
  test("strips fields beyond type, props and children", async () => {
    const extra = [
      VALID[0],
      { op: "add", path: "/elements/main", value: { type: "Stack", props: {}, children: [], on: { press: { action: "x" } }, repeat: { statePath: "/items" }, visible: false } },
    ];
    const { handler } = handlerWith({ model: mockModel(extra) });
    const out = await lines(await ask(handler));
    expect(out[1].value).toEqual({ type: "Stack", props: {}, children: [] });
  });
  test("a protected case-study slug is filtered out", async () => {
    const slug = gated[0].data.permalink.split("/").filter(Boolean).pop();
    const leak = [...VALID, { op: "add", path: "/elements/x", value: { type: "CaseStudyExcerpt", props: { slug, section: "overview" }, children: [] } }];
    const { handler } = handlerWith({ model: mockModel(leak) });
    expect(await lines(await ask(handler))).toEqual(VALID);
  });
});
