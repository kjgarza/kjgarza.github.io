---
name: generate-application
description: This skill should be used when the user says "apply for [job URL]", "generate application for", "prepare my CV for", "create application package for", "write a cover letter for", or provides a job posting URL and wants to apply. Generates a full application package — targeted CV data file, analysis, and cover letter — saved under applications/[company]-[role]/ in the project root.
version: 0.1.0
argument-hint: "[job-url]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Agent", "WebFetch"]
---

# generate-application

Generate a complete, targeted application package for a job posting. The output lives at `applications/YYYY-MM-DD-[company]-[role-slug]/` in the project root and includes a deep analysis, a targeted CV data file, and a two-paragraph cover letter.

## Step 1 — Fetch and Parse the Job Posting

Fetch the job posting using Jina Reader for clean markdown output:

```bash
curl -s -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[job-url]"
```

If `JINA_API_KEY` is not set, fall back to `WebFetch` with the raw URL.

Extract from the posting:
- Company name and role title
- Required and preferred skills/technologies
- Seniority signals (years experience, leadership expectations)
- Work arrangement (remote, hybrid, location)
- Mission/culture signals

## Step 2 — Read Kristian's Profile

Read the full candidate profile before scoring:

```
$CLAUDE_PLUGIN_ROOT/skills/generate-application/references/kristian-profile.md
```

Also read the scoring matrix and tone/voice reference:

```
$CLAUDE_PLUGIN_ROOT/skills/generate-application/references/scoring-matrix.md
$CLAUDE_PLUGIN_ROOT/skills/generate-application/references/tone-and-voice.md
```

## Step 3 — Score and Analyze

Apply the multi-dimensional scoring matrix (see `references/scoring-matrix.md`).

Produce for `analysis.md`:
- Overall score (%)
- Dimension-by-dimension breakdown with reasoning
- Positioning frame (Lead/Principal Engineer, Engineering Manager, Head of, Staff Engineer)
- Requirement → proof point mapping table (every listed requirement matched or flagged as a gap)
- Honest gap assessment
- Recommendation: GO / STRETCH / PASS

If score < 60% (PASS), tell the user and stop — do not generate a cover letter or CV data for a role with poor fit.

## Step 4 — Determine Output Slug

Derive folder name:
- `company`: lowercase, no spaces, no punctuation (e.g. `iris`, `deepmind`)
- `role-slug`: kebab-case from role title (e.g. `tech-lead`, `staff-engineer`)
- `date`: today's date as `YYYY-MM-DD`
- Full path: `applications/[date]-[company]-[role-slug]/`

The `applications/` directory lives in the project root. Create it (and the slug subfolder) if it doesn't exist.

## Step 5 — Save job-posting.md

Write the raw parsed job description to `applications/[slug]/job-posting.md`.

## Step 6 — Save analysis.md

Write the full analysis (Step 3 output) to `applications/[slug]/analysis.md`.

## Step 7 — Generate cv-data.js

Generate a targeted CV data file for this role. This is a CommonJS module that exports an object matching the schema in `src/_data/cvIris.js` (the canonical example of a targeted CV variant — use this as the schema reference, not `src/_data/cv.js`).

Apply tone and voice guidance from `references/tone-and-voice.md` when writing the profile statement and employment bullets.

Reframe employment bullets, profile statement, and skill rankings to match:
- The role's tech stack (prioritise skills they listed first)
- The positioning frame chosen in Step 3
- Concrete proof points with metrics from `references/kristian-profile.md`
- Honest language — do not invent technologies or claim expertise not in the profile

Save to `applications/[slug]/cv-data.js`.

Also print instructions for the user to integrate it:
1. Copy `cv-data.js` → `src/_data/cv[Company].js` (camelCase, e.g. `cvDeepMind.js`, `cvCrossref.js`)
2. Rebuild: `bun run build`

## Step 8 — Generate Cover Letter via Agent

Dispatch the `cover-letter-writer` agent with:
- The job posting content
- The analysis (positioning frame, top 3 proof points, gaps)
- The company name and role title

The agent returns a greeting line, a two-paragraph cover letter body in a warm, helpful, audience-first tone, and a concise close line (for example, "Sincerely,"). It avoids em dashes in output and does not force a first-90-days commitment. Save to `applications/[slug]/cover-letter.md`.

Invoke using the Agent tool with subagent_type matching the `cover-letter-writer` agent. Pass all context in the prompt.

## Step 9 — Write README.md

Write `applications/[slug]/README.md` using the template in `references/output-structure.md`. Status should be `Draft` by default.

## Step 10 — Present Summary

Tell the user:
- Score and recommendation
- Folder path where files were saved
- Which files were generated
- How to integrate `cv-data.js` into the site
- One-line suggested email subject line for the application

## Reference Files

- **`references/kristian-profile.md`** — Full candidate profile with proof points and tech stack
- **`references/scoring-matrix.md`** — Scoring dimensions, thresholds, and proof point language
- **`references/output-structure.md`** — Folder layout, file formats, and integration steps
- **`references/tone-and-voice.md`** — Voice rules for cover letter, CV profile, and employment bullets

## Notes

- Always read the full posting before scoring — do not assume from job title alone
- Be honest about gaps — authenticity over overselling
- The cover letter body must be exactly 2 paragraphs. The agent enforces this.
- If the job URL redirects or is behind a wall, ask the user to paste the posting text directly
