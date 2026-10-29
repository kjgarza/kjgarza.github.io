// Jev engine for /ask/. Jev (typesafe-ai/jev, via Vercel AI Gateway) is a
// decision model: it doesn't write JSON or prose, it answers "does this
// question need this element?" for candidates built here from the site data,
// then orders the ones it keeps. So nothing on the page is model-written text:
// the Answer line is one of three fixed sentences picked by the outcome.
// json-render's composer is experimental_ and pre-1.0; the version is pinned.
import { experimental_composeSpec } from "@json-render/core";

export const JEV_ANSWERS = {
  found: "Here's what on my site answers that.",
  unavailable: "That's not in my portfolio. Ask me directly and I'll tell you.",
  failed: "Sorry, I couldn't answer that just now.",
};

const DESCRIPTION_MAX_CHARS = 280;
const clip = (s) => (s.length <= DESCRIPTION_MAX_CHARS ? s : s.slice(0, s.lastIndexOf(" ", DESCRIPTION_MAX_CHARS - 1)) + "…");
const idPart = (s) => s.replace(/[^\w-]+/g, "-");

// One candidate per thing the page can show. Descriptions are all the evaluator
// sees of the site, and come from public data only (see site-data.js).
export function buildCandidates(data) {
  const item = (id, description, type, props = {}) => ({ id, description: clip(description), element: { type, props }, root: false });
  return [
    {
      id: "answer",
      description: "An answer to a visitor's question about Kristian Garza's work, skills, experience, projects, writing or side projects, shown as a list of matching items from his portfolio.",
      element: { type: "Stack", props: {} },
    },
    ...data.work.map((w) => item(`work-${idPart(w.id)}`, `Project: ${w.title} (${w.company}). ${w.description} Tags: ${w.tags.join(", ")}.`, "WorkCard", { id: w.id })),
    ...data.caseStudies.flatMap((cs) =>
      cs.sections.map((s) =>
        item(`cs-${idPart(cs.slug)}-${idPart(s.id)}`, `Case study passage from "${cs.title}", section "${s.heading}": ${s.excerpt}`, "CaseStudyExcerpt", { slug: cs.slug, section: s.id })
      )
    ),
    ...data.publications.map((p, i) => item(`pub-${i + 1}`, `Publication (${p.publicationYear}): ${p.title}`, "Publication", { id: p.id })),
    ...data.tools.map((t) => item(`tool-${idPart(t.id)}`, `Side project: ${t.name} (${t.type}). ${t.description}`, "ToolCard", { id: t.id })),
    ...data.roles.map((r) => item(`role-${idPart(r.id)}`, `Job: ${r.role} at ${r.company}, ${r.period}. ${r.summary ?? ""}`, "Timeline", { roles: [r.id] })),
    item("contact", "Get in touch button. Include it when the visitor wants to hire, contact or work with Kristian.", "ContactCTA"),
  ];
}

const answerSpec = (text, extra = []) => ({
  root: "root",
  elements: {
    root: { type: "Stack", props: {}, children: ["answer", ...extra.map((e) => e[0])] },
    answer: { type: "Answer", props: { text }, children: [] },
    ...Object.fromEntries(extra),
  },
});

// Put the fixed Answer first and fold per-role Timeline picks into one, newest first
function present(spec, data) {
  const rootEl = spec?.elements?.[spec.root];
  const keys = rootEl?.children ?? [];
  if (!keys.length) return answerSpec(JEV_ANSWERS.unavailable, [["contact", { type: "ContactCTA", props: {}, children: [] }]]);
  const order = data.roles.map((r) => r.id);
  const timelineKeys = keys.filter((k) => spec.elements[k].type === "Timeline");
  const roles = timelineKeys.flatMap((k) => spec.elements[k].props.roles).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const children = keys.filter((k) => !timelineKeys.slice(1).includes(k));
  const elements = Object.fromEntries(children.map((k) => [k, spec.elements[k]]));
  if (timelineKeys.length) elements[timelineKeys[0]] = { ...elements[timelineKeys[0]], props: { roles } };
  return {
    root: spec.root,
    elements: {
      [spec.root]: { ...rootEl, children: ["answer", ...children] },
      answer: { type: "Answer", props: { text: JEV_ANSWERS.found }, children: [] },
      ...elements,
    },
  };
}

// JSONL patches that bring the client from `sent` to `spec`, whole elements at a time
function* patchesFor(spec, sent) {
  if (sent.root !== spec.root) yield JSON.stringify({ op: "add", path: "/root", value: spec.root }) + "\n";
  sent.root = spec.root;
  for (const [key, element] of Object.entries(spec.elements)) {
    const json = JSON.stringify(element);
    if (sent.elements[key] === json) continue;
    sent.elements[key] = json;
    yield JSON.stringify({ op: "add", path: `/elements/${key}`, value: element }) + "\n";
  }
}

export function createJevEngine({ evaluate, maxElements = 9, maxSteps = 4, compose = experimental_composeSpec }) {
  const candidatesFor = new WeakMap();
  return async function* ({ prompt, ctx, signal }) {
    const { data } = ctx.source;
    if (!candidatesFor.has(ctx.source)) candidatesFor.set(ctx.source, buildCandidates(data));
    const sent = { root: null, elements: {} };
    try {
      for await (const event of compose({
        catalog: ctx.catalog,
        candidates: candidatesFor.get(ctx.source),
        prompt,
        evaluate,
        signal,
        maxElements,
        maxSteps,
        context: { site: "Kristian Garza's portfolio site" },
        instructions: { root: "Choose unavailable when user_request is not about Kristian Garza or his work." },
      })) {
        if (event.type === "step" || event.spec) yield* patchesFor(present(event.spec, data), sent);
        else if (event.stopReason === "unavailable") yield* patchesFor(present(null, data), sent);
        // Out of budget with nothing composed (stopReason "limit")
        else if (!sent.root) yield* patchesFor(answerSpec(JEV_ANSWERS.failed), sent);
      }
    } catch (err) {
      if (signal?.aborted) return;
      console.error("ask: Jev composition failed", err);
      // A partial answer already on screen stays; otherwise say so plainly
      if (!sent.root) yield* patchesFor(answerSpec(JEV_ANSWERS.failed), sent);
    }
  };
}
