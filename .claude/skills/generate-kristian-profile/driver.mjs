#!/usr/bin/env node
/*
 * generate-kristian-profile — regenerate the candidate profile used by the
 * generate-application skill, straight from the site's own data.
 *
 * Sources (all under the project root):
 *   src/_data/site.js         → identity, job title, ORCID, languages, knowsAbout
 *   src/_data/cv.js           → skill inventory (grouped into tech-stack buckets)
 *   src/_data/work.js         → featured case studies (title, company, tags, link)
 *   src/work/<slug>.md        → per-case-study Overview / Tech Stack / Impact / metrics
 *   src/_data/publications.js → publications, grouped by theme
 *   src/_data/tools.js        → side projects (initiative signals)
 *
 * Output:
 *   .claude/skills/generate-application/references/kristian-profile.md
 *
 * Usage:
 *   node .claude/skills/generate-kristian-profile/driver.mjs [--check] [-o <path>]
 *     --check   print the profile to stdout, do NOT write the file (diff/preview)
 *     -o PATH   write somewhere else than the default reference path
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

// Project root is three levels up from this skill dir.
const skillDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(skillDir, "../../..");
const dataDir = path.join(root, "src/_data");
const workDir = path.join(root, "src/work");
const DEFAULT_OUT = path.join(
  root,
  ".claude/skills/generate-application/references/kristian-profile.md"
);

// ── args ──────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const check = argv.includes("--check");
const oi = argv.indexOf("-o");
const outPath = oi !== -1 ? path.resolve(process.cwd(), argv[oi + 1]) : DEFAULT_OUT;

// ── load data modules ───────────────────────────────────────────────────────
const site = require(path.join(dataDir, "site.js"));
const cv = require(path.join(dataDir, "cv.js"));
const work = require(path.join(dataDir, "work.js"));
const publications = require(path.join(dataDir, "publications.js"));
const tools = require(path.join(dataDir, "tools.js"));

// ── strategy constants ──────────────────────────────────────────────────────
// Not derivable from site data — these are positioning decisions, kept here so
// the profile stays self-contained and regeneration preserves them. Edit here.
const TARGET_ROLE = `## Target Role Parameters

- **Seniority**: Above-senior — Staff, Lead, Principal, Manager, Director
- **Arrangement**: Remote-first, Europe-based (Berlin preferred)
- **Tracks**:
  - Track A: Frontier AI labs (Anthropic, OpenAI, Google DeepMind, Mistral, Cohere, etc.)
  - Track B: Research infrastructure organizations (CZI, Crossref, ORCID, OpenAlex, etc.)`;

const POSITIONING_FRAMES = `## Dynamic Positioning Frames

Choose the frame based on each job posting's emphasis:

| Frame | When to use | Lead evidence |
|-------|-------------|---------------|
| **Lead/Principal Engineer** | Role emphasizes technical architecture, mentorship, system design | Query Translation API, Knowledge Graph Engine, Sashimi API |
| **AI/Agentic Systems Engineer** | Role emphasizes LLM/RAG, agents, MCP, evaluation | Knowledge Graph Engine, Repo Atlas, Query Translation API, promptfoo eval loop |
| **Engineering Manager** | Role emphasizes cross-functional coordination, team building | Harvesting Services (56-person research), Design System (4-person team) |
| **Head of / Director** | Role owns a domain (Head of AI, Director of Infrastructure) | AI depth + infrastructure scale + design leadership combined |
| **Staff Engineer** | Role emphasizes deep IC work with org-wide influence | Publications record + production systems + cross-domain expertise |`;

// ── helpers ─────────────────────────────────────────────────────────────────
const orcidUrl =
  (site.schema_org?.sameAs || []).find((u) => /orcid\.org\/\d/.test(u)) || "";
const orcid = orcidUrl.match(/(\d{4}-\d{4}-\d{4}-[\dX]{4})/)?.[1] || "";
const languages = (site.schema_org?.knowsLanguage || []).map((l) => l.name);

// Split a markdown body into a { heading: text } map keyed by ## / ### titles.
function sectionMap(body) {
  const out = {};
  const lines = body.split("\n");
  let cur = null;
  for (const line of lines) {
    const m = line.match(/^#{2,3}\s+(.*)$/);
    if (m) {
      cur = m[1].trim();
      out[cur] = "";
    } else if (cur) {
      out[cur] += line + "\n";
    }
  }
  return out;
}

const clean = (s) =>
  (s || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // strip images
    .replace(/\{\{[^}]*\}\}/g, "") // strip nunjucks
    .replace(/\n{2,}/g, "\n")
    .trim();

// Strong metric signal: a percentage, a 3+ digit / comma figure, an "Nx"
// multiplier, or an "N-<noun>" count. Guards against picking up prose that
// merely contains a stray "2." from an ordered list.
const METRIC_RE = /\d+%|\d[\d,]{2,}|\d+x\b|\d+-(person|dataset|response|entity|organi[sz]ation|point)/i;

// Numeric metrics: bold spans anywhere that carry a strong metric signal.
// Bold spans in these case studies are exactly the highlighted figures
// ("70%", "50,000-dataset", "12 new users") — reliable, unlike prose lists.
function metrics(fullBody) {
  const hits = new Set();
  for (const m of fullBody.matchAll(/\*\*([^*\n]*\d[^*\n]*)\*\*/g)) {
    const t = m[1].trim();
    if (METRIC_RE.test(t) && t.length < 90) hits.add(t);
  }
  return [...hits].slice(0, 6);
}

// Clean one-line accomplishments from the "Key Achievements" section:
// each is "**Bold lead** trailing clause" — keep the whole sentence, flatten.
function achievements(section) {
  if (!section) return [];
  return [...section.matchAll(/^[-*]\s+(.*)$/gm)]
    .map((m) => m[1].replace(/\*\*/g, "").trim())
    .filter((t) => t.length > 8 && t.length < 140)
    .slice(0, 5);
}

// Load and index the featured case studies referenced by work.js.
const mdFiles = readdirSync(workDir).filter((f) => f.endsWith(".md"));
const bySlug = {};
for (const f of mdFiles) {
  const raw = readFileSync(path.join(workDir, f), "utf8");
  const { data, content } = matter(raw);
  const slug = (data.permalink || `/work/${f.replace(/\.md$/, "")}/`)
    .replace(/^\/work\//, "")
    .replace(/\/$/, "");
  bySlug[slug] = { data, sections: sectionMap(content), content };
}

// ── proof points from work.js order ─────────────────────────────────────────
const proofBlocks = work.map((item, i) => {
  const slug = item.link.replace(/^\/work\//, "").replace(/\/$/, "");
  const cs = bySlug[slug];
  const s = cs?.sections || {};
  const overview = clean(s["Overview"]).split("\n")[0] || item.description;
  const tech = clean(s["Technology Stack"])
    .split("\n")
    .filter((l) => /^[-*]/.test(l))
    .map((l) => l.replace(/^[-*]\s*/, "").replace(/\*\*/g, ""))
    .join(", ");
  const mx = cs ? metrics(cs.content) : [];
  const ax = achievements(s["Key Achievements"]);

  let block = `### ${i + 1}. ${item.title} (${item.company})\n\n`;
  block += `**Tags**: ${(item.tags || []).join(", ")}\n\n`;
  block += `**Summary**: ${overview}\n\n`;
  if (ax.length) block += `**Highlights**:\n${ax.map((a) => `- ${a}`).join("\n")}\n\n`;
  if (mx.length) block += `**Metrics**: ${mx.join(" · ")}\n\n`;
  if (tech) block += `**Tech**: ${tech}\n\n`;
  block += `**Source**: \`src/work/${slug}.md\`\n`;
  return block;
});

// ── tech stack: bucket cv.js skill names ────────────────────────────────────
const buckets = {
  "AI/ML & LLMs": /llm|openai|claude|langchain|llama|rag|mcp|embedding|pgvector|prompt|agent|sagemaker|hugging|vector|graph/i,
  "Backend & Infrastructure": /python|fastapi|ruby|rails|node|docker|kubernetes|aws|sst|dynamo|sql|postgres|sqlite|rust|api|github actions|effect-ts|trpc|serverless/i,
  "Frontend & Design": /react|vue|next|typescript|tailwind|eleventy|bun|tiptap|figma|playwright|design|ux|storybook/i,
};
const skillNames = cv.skills.map((s) => s.name);
const grouped = { "AI/ML & LLMs": [], "Backend & Infrastructure": [], "Frontend & Design": [], Other: [] };
for (const name of skillNames) {
  const hit = Object.keys(buckets).find((b) => buckets[b].test(name));
  grouped[hit || "Other"].push(name);
}

// ── publications by theme ───────────────────────────────────────────────────
const themes = {
  "LLMs & Scholarly Metadata": /llm|language model|chatgpt|gpt|parrot|schema mapping|language user interface|subject classification/i,
  "Design & UX": /design system|design process|thinking/i,
  "PIDs & Research Infrastructure": /pid|persistent identifier|bibliometric|fair|dmp|repositor|metadata|commons|mdc|citation/i,
};
const pubByTheme = { "LLMs & Scholarly Metadata": [], "Design & UX": [], "PIDs & Research Infrastructure": [], Other: [] };
for (const p of publications) {
  const t = Object.keys(themes).find((k) => themes[k].test(p.title));
  pubByTheme[t || "Other"].push(p);
}

// ── assemble markdown ───────────────────────────────────────────────────────
const L = [];
L.push(`# ${site.author.name} - Candidate Profile`, "");
L.push(
  "> Generated from `src/_data/` by `.claude/skills/generate-kristian-profile/driver.mjs`.",
  "> Do not hand-edit — re-run the driver after changing the site data.",
  ""
);

L.push("## Identity", "");
L.push(`- **Name**: ${site.author.name}`);
L.push(`- **Current Role**: ${site.schema_org.jobTitle} at ${site.schema_org.affiliation.name}`);
L.push(`- **Location**: Berlin, Germany`);
if (languages.length) L.push(`- **Languages**: ${languages.join(", ")}`);
if (orcid) L.push(`- **ORCID**: ${orcid}`);
L.push(`- **LinkedIn**: ${site.author.linkedin}`);
L.push(`- **GitHub**: ${site.author.github}`);
L.push(`- **Portfolio**: ${site.url}`, "");

L.push("## Positioning Statement", "");
L.push(site.description.trim(), "");
L.push(`**Currently**: ${site.bio.currently.trim()}`, "");
L.push(`**Past**: ${site.bio.past.trim()}`, "");
L.push(`**Also**: ${site.bio.findMe.trim()}`, "");

L.push(TARGET_ROLE, "");

L.push("## Employment History", "");
for (const job of cv.employment) {
  L.push(`### ${job.role} — ${job.company}${job.location ? `, ${job.location}` : ""} (${job.period})`, "");
  for (const b of job.bullets) L.push(`- ${b}`);
  L.push("");
}

L.push("## Case Study Proof Points", "");
L.push(...proofBlocks.flatMap((b) => [b, ""]));

L.push("## Technical Stack (from cv.js skills)", "");
for (const [b, list] of Object.entries(grouped)) {
  if (!list.length) continue;
  L.push(`### ${b}`);
  L.push(list.join(", "), "");
}

L.push("## Publications (by theme)", "");
for (const [t, list] of Object.entries(pubByTheme)) {
  if (!list.length) continue;
  L.push(`### ${t}`);
  for (const p of list.sort((a, b) => b.publicationYear - a.publicationYear))
    L.push(`- "${p.title.replace(/\.$/, "")}" (${p.publicationYear})`);
  L.push("");
}
L.push(`**Total**: ${publications.length} publications on record.`, "");

L.push("## Side Projects (initiative signals)", "");
L.push("| Project | Type | What it shows |", "|---|---|---|");
for (const t of tools)
  L.push(`| **${t.name}** | ${t.type.replace(/\s+/g, " ")} | ${t.description} |`);
L.push("");

L.push("## Education", "");
for (const e of cv.education)
  L.push(`- **${e.degree}**, ${e.institution}, ${e.location} (${e.period})`);
L.push("");

L.push(POSITIONING_FRAMES, "");

const md = L.join("\n").replace(/\n{3,}/g, "\n\n") + "\n";

if (check) {
  process.stdout.write(md);
} else {
  writeFileSync(outPath, md);
  const kb = (md.length / 1024).toFixed(1);
  console.log(`profile written → ${path.relative(root, outPath)} (${kb} KB)`);
  console.log(
    `sources: ${work.length} case studies, ${publications.length} publications, ${tools.length} side projects, ${cv.skills.length} skills`
  );
}
