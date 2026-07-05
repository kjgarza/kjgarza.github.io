---
name: generate-application
description: This skill should be used when the user says "apply for [job URL]", "generate application for", "prepare my CV for", "create application package for", "write a cover letter for", or provides a job posting URL and wants to apply. Generates a full application package — targeted CV data file, analysis, application form answers, and cover letter — saved under applications/[company]-[role]/ in the project root.
version: 0.2.0
argument-hint: "[job-url]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Agent", "WebFetch"]
---

# generate-application

Generate a complete, targeted application package for a job posting. The output lives at `applications/YYYY-MM-DD-[company]-[role-slug]/` in the project root and includes a deep analysis, a targeted CV data file, drafted answers to the actual application form questions, and a two-paragraph cover letter.

**A job ad is not the application.** The real application lives on a separate apply deep link (Greenhouse `#app` form, Lever `/apply`, Ashby `/application`, Workable apply page, …) with screening questions, essay prompts, and factual fields the ad never mentions. A package that skips these is incomplete — Step 2 is mandatory, not optional.

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

## Step 2 — Fetch the Application Form (Deep Link) and Extract Questions

Discover the apply deep link and pull the actual application questions:

```bash
bash .agents/skills/generate-application/scripts/fetch-application-form.sh "[job-url]"
```

Returns JSON: `{url, ats, apply_url, source, questions, form_text}`. The script uses the ATS's public API where one exists (Greenhouse `?questions=true`, Workable form API — both return labels, required flags, and dropdown options) and falls back to scraping the apply page.

Interpret the result:
- **`questions` non-empty** — use them directly; they are the authoritative form.
- **`questions` empty but `form_text` has content** — read `form_text` and extract every question/field the form asks for yourself.
- **Both empty** (`source: "none"` — JS-only page or login wall) — fetch `apply_url` with `WebFetch`; if browser tools are available (`mcp__claude-in-chrome__navigate` + `get_page_text`), open `apply_url` and read the rendered form.
- **Still unreadable** — record this explicitly in `application-questions.md` with the `apply_url` so the user can open it manually. Never silently skip the form.

Classify each question into three buckets (used in Step 9):
1. **Essay/motivation questions** ("Why do you want to work here?", "Describe a project…") — these need drafted answers.
2. **Factual questions** (salary expectation, notice period, visa/work authorization, start date, location, years of experience) — answer from the profile where possible.
3. **Standard fields** (name, email, phone, CV/resume upload, LinkedIn URL) — list them so nothing is a surprise, but no draft needed.

## Step 3 — Read Kristian's Profile

Read the full candidate profile before scoring:

```
.agents/skills/generate-application/references/kristian-profile.md
```

Also read the scoring matrix and tone/voice reference:

```
.agents/skills/generate-application/references/scoring-matrix.md
.agents/skills/generate-application/references/tone-and-voice.md
```

## Step 4 — Score and Analyze

Apply the multi-dimensional scoring matrix (see `references/scoring-matrix.md`).

Produce for `analysis.md`:
- Overall score (%)
- Dimension-by-dimension breakdown with reasoning
- Positioning frame (Lead/Principal Engineer, Engineering Manager, Head of, Staff Engineer)
- Requirement → proof point mapping table (every listed requirement matched or flagged as a gap)
- Honest gap assessment
- Recommendation: GO / STRETCH / PASS

If score < 60% (PASS), tell the user and stop — do not generate a cover letter or CV data for a role with poor fit.

## Step 5 — Determine Output Slug

Derive folder name:
- `company`: lowercase, no spaces, no punctuation (e.g. `iris`, `deepmind`)
- `role-slug`: kebab-case from role title (e.g. `tech-lead`, `staff-engineer`)
- `date`: today's date as `YYYY-MM-DD`
- Full path: `applications/[date]-[company]-[role-slug]/`

The `applications/` directory lives in the project root. Create it (and the slug subfolder) if it doesn't exist.

## Step 6 — Save job-posting.md

Write the raw parsed job description to `applications/[slug]/job-posting.md`. Include the `apply_url` from Step 2 at the top.

## Step 7 — Save analysis.md

Write the full analysis (Step 4 output) to `applications/[slug]/analysis.md`.

## Step 8 — Generate cv-data.js

Generate a targeted CV data file for this role. This is a CommonJS module that exports an object matching the schema in `src/_data/cvIris.js` (the canonical example of a targeted CV variant — use this as the schema reference, not `src/_data/cv.js`).

Apply tone and voice guidance from `references/tone-and-voice.md` when writing the profile statement and employment bullets.

Reframe employment bullets, profile statement, and skill rankings to match:
- The role's tech stack (prioritise skills they listed first)
- The positioning frame chosen in Step 4
- Concrete proof points with metrics from `references/kristian-profile.md`
- Honest language — do not invent technologies or claim expertise not in the profile

Save to `applications/[slug]/cv-data.js`.

Also print instructions for the user to integrate it:
1. Copy `cv-data.js` → `src/_data/cv[Company].js` (camelCase, e.g. `cvDeepMind.js`, `cvCrossref.js`)
2. Rebuild: `bun run build`

## Step 9 — Draft application-questions.md

Write `applications/[slug]/application-questions.md` covering **every** question found in Step 2, grouped by bucket:

```markdown
# Application Form: [Role] at [Company]

**Apply URL**: [apply_url]
**Form source**: api / apply-page / manual (browser) / unreadable

## Essay & Motivation Questions
### Q: [question text] (required, max N words if stated)
[Drafted answer — tone-and-voice rules, concrete proof points with metrics,
respect any stated word/character limit, honest.]

## Factual Questions
| Question | Answer |
|----------|--------|
| [e.g. Notice period] | [from profile, or `[FILL ME: notice period]`] |

## Standard Fields (no draft needed)
- Name, email, CV upload, ...
```

Rules:
- Draft essay answers with the same voice rules as the cover letter (`references/tone-and-voice.md`) — no em dashes, no invented experience.
- For yes/no screeners, answer honestly from the profile. If an honest answer is a knockout risk (e.g. "Do you have X?" and the profile says no), flag it prominently rather than fudging it.
- For personal facts not in the profile (salary expectation, notice period, visa status, earliest start date), insert a `[FILL ME: …]` placeholder — never guess.
- If the form could not be read at all, this file must still exist, containing the `apply_url` and a note telling the user to check the form manually before submitting.

## Step 10 — Generate Cover Letter via Agent

Dispatch the `cover-letter-writer` agent with:
- The job posting content
- The analysis (positioning frame, top 3 proof points, gaps)
- The company name and role title
- Any essay questions from Step 2 that overlap with cover letter territory (so the letter and the form answers complement rather than repeat each other)

The agent returns a greeting line, a two-paragraph cover letter body in a warm, helpful, audience-first tone, and a concise close line (for example, "Sincerely,"). It avoids em dashes in output and does not force a first-90-days commitment. Save to `applications/[slug]/cover-letter.md`.

Invoke using the Agent tool with subagent_type matching the `cover-letter-writer` agent. Pass all context in the prompt.

## Step 11 — Write README.md

Write `applications/[slug]/README.md` using the template in `references/output-structure.md`. Status should be `Draft` by default. Include the `apply_url` and list any `[FILL ME]` placeholders still open.

## Step 12 — Present Summary

Tell the user:
- Score and recommendation
- Folder path where files were saved
- Which files were generated
- The apply deep link, how many form questions were found, and any `[FILL ME]` placeholders that need their input before submitting
- How to integrate `cv-data.js` into the site
- One-line suggested email subject line for the application

## Reference Files

- **`references/kristian-profile.md`** — Full candidate profile with proof points and tech stack
- **`references/scoring-matrix.md`** — Scoring dimensions, thresholds, and proof point language
- **`references/output-structure.md`** — Folder layout, file formats, and integration steps
- **`references/tone-and-voice.md`** — Voice rules for cover letter, CV profile, and employment bullets

## Scripts

- **`scripts/fetch-application-form.sh <job-url>`** — Discover the apply deep link and extract application form questions (`{url, ats, apply_url, source, questions, form_text}` JSON). Handles Greenhouse, Lever, Ashby, Workable, SmartRecruiters, and generic career pages.

## Notes

- Always read the full posting before scoring — do not assume from job title alone
- Be honest about gaps — authenticity over overselling
- The cover letter body must be exactly 2 paragraphs. The agent enforces this.
- The package is not complete without `application-questions.md` — either with the form's questions answered, or with an explicit note that the form is behind a login/JS wall and must be checked manually
- If the job URL redirects or is behind a wall, ask the user to paste the posting text directly
