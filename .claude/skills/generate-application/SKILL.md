---
name: generate-application
description: "This skill should be used when the user says \"apply for [job URL]\", \"generate application for\", \"prepare my CV for\", \"create application package for\", \"write a cover letter for\", or provides a job posting URL and wants to apply. Generates a full application package — targeted CV, analysis, application form answers, and cover letter — saved under the candidate's applications directory. Profile-parameterized: defaults to Kristian, pass --profile <id> (e.g. claudia) for another candidate."
version: 0.3.0
argument-hint: "[job-url] [--profile <id>]"
allowed-tools: ["Bash", "Read", "Write", "Edit", "Glob", "Grep", "Agent", "WebFetch"]
---

# generate-application

Generate a complete, targeted application package for a job posting. The output lives at `<applications>/YYYY-MM-DD-[company]-[role-slug]/` — the resolved profile's applications directory — and includes a deep analysis, a targeted CV, drafted answers to the actual application form questions, and a two-paragraph cover letter.

**A job ad is not the application.** The real application lives on a separate apply deep link (Greenhouse `#app` form, Lever `/apply`, Ashby `/application`, Workable apply page, …) with screening questions, essay prompts, and factual fields the ad never mentions. A package that skips these is incomplete — Step 2 is mandatory, not optional.

## Step 0 — Resolve the Profile

This skill is profile-parameterized. Resolve which candidate it runs for **before** anything else:

1. `--profile <id>` in the invocation wins.
2. Otherwise `$JOB_PROFILE` from the environment.
3. Otherwise the profile with `"default": true` (currently `kristian`).

Read `.claude/profiles/<id>/config.json` and resolve its `references`, `storage`, and `cv` blocks. All config paths are repo-root-relative. From here on this document writes them as `<profile>`, `<scoringMatrix>`, `<toneAndVoice>`, `<applications>`, and so on.

If the id is unknown, or a `references` path does not exist on disk, **stop and name the missing file.** Never fall back to another candidate's files: writing one person's proof points into another person's cover letter is exactly what this indirection exists to prevent. See `.claude/profiles/README.md`.

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
bash .claude/skills/generate-application/scripts/fetch-application-form.sh "[job-url]"
```

Returns JSON: `{url, ats, apply_url, source, needs_browser, questions, form_text}`. The script uses the ATS's public API where one exists (Greenhouse `?questions=true`, Workable form API, Ashby GraphQL posting API — all return labels, required flags, and dropdown options) and falls back to scraping the apply page.

Interpret the result:
- **`needs_browser: false`** — `questions` is authoritative; use it directly.
- **`needs_browser: true`** — the form wasn't captured (empty `questions`; `form_text` is at best a thin JD blob). Open `apply_url` with browser tools (`mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__get_page_text`) and read the rendered form. If browser tools are unavailable, extract whatever you can from `form_text`, then try `WebFetch` on `apply_url`.
- **Still unreadable** — record this explicitly in `application-questions.md` with the `apply_url` so the user can open it manually. Never silently skip the form.

Classify each question into three buckets (used in Step 9):
1. **Essay/motivation questions** ("Why do you want to work here?", "Describe a project…") — these need drafted answers.
2. **Factual questions** (salary expectation, notice period, visa/work authorization, start date, location, years of experience) — answer from the profile where possible.
3. **Standard fields** (name, email, phone, CV/resume upload, LinkedIn URL) — list them so nothing is a surprise, but no draft needed.

## Step 3 — Read the Candidate Profile

Read the full candidate profile before scoring — the path comes from the resolved config, not from this file:

```
<profile>            e.g. .claude/skills/generate-application/references/kristian-profile.md
```

Also read the scoring matrix and tone/voice reference for this profile:

```
<scoringMatrix>
<toneAndVoice>
```

## Step 4 — Score and Analyze

Apply the multi-dimensional scoring matrix from `<scoringMatrix>`. Dimensions, weights, and knockout rules are profile-specific — use the resolved file, never a remembered matrix.

Produce for `analysis.md`:
- Overall score (%)
- Dimension-by-dimension breakdown with reasoning
- Positioning frame, drawn from the profile's own framing (for `kristian`: Lead/Principal Engineer, Engineering Manager, Head of, Staff Engineer; for other profiles use the frames their profile document names)
- Requirement → proof point mapping table (every listed requirement matched or flagged as a gap)
- Honest gap assessment
- Recommendation: GO / STRETCH / PASS, using the thresholds in `<scoringMatrix>`

If the recommendation is PASS, tell the user and stop — do not generate a cover letter or CV for a role with poor fit.

## Step 5 — Determine Output Slug

Derive folder name:
- `company`: lowercase, no spaces, no punctuation (e.g. `iris`, `deepmind`)
- `role-slug`: kebab-case from role title (e.g. `tech-lead`, `staff-engineer`)
- `date`: today's date as `YYYY-MM-DD`
- Full path: `<applications>/[date]-[company]-[role-slug]/`

`<applications>` is `storage.applications` from the resolved config (`applications/` for `kristian`, `claudia/applications/` for `claudia`). It is a symlink into external storage created by `scripts/setup-storage.sh`. If the symlink is missing, run that script rather than creating a real directory in the repo — application packages must never be committed.

## Step 6 — Save job-posting.md

Write the raw parsed job description to `<applications>/[slug]/job-posting.md`. Include the `apply_url` from Step 2 at the top.

## Step 7 — Save analysis.md

Write the full analysis (Step 4 output) to `<applications>/[slug]/analysis.md`.

## Step 8 — Produce the CV

Branch on `cv.mode` in the resolved config.

### `cv.mode: "data-driven"` (profiles: `kristian`, `claudia`)

Generate a targeted CV data file for this role by copying the profile's `cv.masterData` and tailoring it. It is a CommonJS module exporting an object matching the schema in the config's `cv.schemaReference` (`src/_data/cvIris.js` — the canonical targeted CV variant; use it as the schema reference, not `src/_data/cv.js`).

Apply tone and voice guidance from `<toneAndVoice>` when writing the profile statement and employment bullets.

Reframe employment bullets, profile statement, and skill rankings to match:
- The role's tech stack (prioritise skills they listed first)
- The positioning frame chosen in Step 4
- Concrete proof points with metrics from `<profile>` and `cv.masterData`, never invented
- Honest language — do not invent technologies or claim expertise not in the profile

Save to `<applications>/[slug]/cv-data.js`.

Also print instructions for the user to integrate it:
1. Copy `cv-data.js` → `src/_data/cv[Company].js` (camelCase, e.g. `cvDeepMind.js`, `cvCrossref.js`)
2. Rebuild: `bun run build`

### `cv.mode: "static-pdf"` (no profile currently uses this)

There is no data-driven CV template for this profile, so there is nothing to generate and nothing to render. Instead:

1. Confirm the file at `cv.file` exists. If it does not, say so and continue — the rest of the package is still useful.
2. Write `<applications>/[slug]/cv-tailoring-notes.md`: which bullets from `<profile>` to lead with for this role, which to cut, and the exact phrasing to use for the summary line, all following `<toneAndVoice>`. This is the manual-edit brief for the existing CV.
3. Record in the package README that `cv.file` is the document to upload.

## Step 8b — Render cv.pdf (`data-driven` profiles only)

Skip this step entirely when `cv.mode` is `static-pdf`.

Render the targeted CV to a PDF straight from `cv-data.js` — no site build required. The script loads the same `cv.njk` layout/template, applies print styling, forces the Education section to start on page 2, and auto-shrinks the content to fit two A4 pages:

```bash
node scripts/cv-to-pdf.js "<applications>/[slug]/cv-data.js"
```

Output lands next to the data file as `<applications>/[slug]/[slug].pdf` (filename matches the folder). The script prints the fit scale and final page count.

- If it warns `still N pages at the … floor`, the CV data is too long — trim bullets in `cv-data.js` and re-run rather than shipping 3+ pages.
- Layout is tunable via flags (`--margin-top N` mm, `--section-gap N` px, `--pages N`, `--scale N`, `--no-fit`); run `node scripts/cv-to-pdf.js` with no args for the full list. Defaults produce the standard two-page layout — only pass flags when a specific CV needs it.

## Step 9 — Draft application-questions.md

Write `<applications>/[slug]/application-questions.md` covering **every** question found in Step 2, grouped by bucket:

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
- Draft essay answers with the same voice rules as the cover letter (`<toneAndVoice>`) — no em dashes, no invented experience.
- For yes/no screeners, answer honestly from the profile. If an honest answer is a knockout risk (e.g. "Do you have X?" and the profile says no), flag it prominently rather than fudging it.
- Salary expectation, notice period, start date, and relocation come from `<decisionPolicy>`, never improvised. If that file still carries a `[FILL ME]` for the field, carry the `[FILL ME]` through to the answer.
- For any other personal fact not in the profile (visa status, references), insert a `[FILL ME: …]` placeholder — never guess.
- If the form could not be read at all, this file must still exist, containing the `apply_url` and a note telling the user to check the form manually before submitting.

## Step 10 — Generate Cover Letter via Agent

Dispatch the `cover-letter-writer` agent with:
- The job posting content
- The analysis (positioning frame, top 3 proof points, gaps)
- The company name and role title
- The candidate's `displayName` from the config, and the full text of `<toneAndVoice>` (voice rules are profile-specific — the agent must not assume the engineering profile's rules)
- Any essay questions from Step 2 that overlap with cover letter territory (so the letter and the form answers complement rather than repeat each other)

The agent returns a greeting line, a two-paragraph cover letter body in a warm, helpful, audience-first tone, and a concise close line (for example, "Sincerely,"). It avoids em dashes in output and does not force a first-90-days commitment. Save to `<applications>/[slug]/cover-letter.md`.

Invoke using the Agent tool with subagent_type matching the `cover-letter-writer` agent. Pass all context in the prompt.

## Step 11 — Write README.md

Write `<applications>/[slug]/README.md` using the template in `references/output-structure.md`. Status should be `Draft` by default. Include the profile id, the `apply_url`, and any `[FILL ME]` placeholders still open.

## Step 12 — Present Summary

Tell the user:
- Which profile the package was generated for
- Score and recommendation
- Folder path where files were saved
- Which files were generated (for `data-driven` profiles including `[slug].pdf` and its final page count; for `static-pdf` profiles, `cv-tailoring-notes.md` and the path of the CV to upload)
- The apply deep link, how many form questions were found, and any `[FILL ME]` placeholders that need their input before submitting
- For `data-driven` profiles, how to integrate `cv-data.js` into the site
- One-line suggested email subject line for the application

## Reference Files

Candidate-specific references are resolved from `.claude/profiles/<id>/config.json` (see `.claude/profiles/README.md`); the paths below are the `kristian` defaults.

- **`<profile>`** — Full candidate profile with proof points and tech stack (`references/kristian-profile.md`)
- **`<scoringMatrix>`** — Scoring dimensions, thresholds, and proof point language (`references/scoring-matrix.md`)
- **`<toneAndVoice>`** — Voice rules for cover letter, CV profile, and employment bullets (`references/tone-and-voice.md`)
- **`<decisionPolicy>`** — Comp targets, notice period, and relocation answers (`../job-pipeline/references/decision-policy.md`)

Profile-agnostic, shared by every profile:

- **`references/output-structure.md`** — Folder layout, file formats, and integration steps

## Scripts

- **`scripts/fetch-application-form.sh <job-url>`** — Discover the apply deep link and extract application form questions (`{url, ats, apply_url, source, needs_browser, questions, form_text}` JSON). Handles Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Factorial, and generic career pages. `needs_browser: true` signals the form must be read with browser tools.
- **`scripts/cv-to-pdf.js <cv-data.js> [out.pdf] [flags]`** — Render a `cv-data.js` to a two-page A4 PDF via the site's `cv.njk` template and puppeteer, no Eleventy build. Auto-fits to `--pages` (default 2). Lives in the project root `scripts/`, not the skill dir.

## Notes

- Always read the full posting before scoring — do not assume from job title alone
- Be honest about gaps in `analysis.md` — authenticity over overselling. But keep gap admissions OUT of the cover letter itself; the letter sells fit, it does not disclaim it (see `<toneAndVoice>`)
- Every fact in the package must trace to the resolved profile's own files. If you catch yourself recalling a proof point that is not in `<profile>`, it belongs to a different candidate — drop it
- The cover letter body must be exactly 2 paragraphs. The agent enforces this.
- The package is not complete without `application-questions.md` — either with the form's questions answered, or with an explicit note that the form is behind a login/JS wall and must be checked manually
- If the job URL redirects or is behind a wall, ask the user to paste the posting text directly
