---
name: generate-kristian-profile
description: Regenerate Kristian's candidate profile (kristian-profile.md) from the site's own data. Use when someone says "regenerate the profile", "rebuild kristian-profile", "the profile is stale", "update the candidate profile from src/_data", or after editing src/_data/cv.js, work.js, publications.js, tools.js, site.js, or a src/work/*.md case study. The profile feeds the generate-application skill.
argument-hint: "[--check]"
allowed-tools: ["Bash", "Read"]
---

# generate-kristian-profile

`.claude/skills/generate-application/references/kristian-profile.md` is the candidate profile that the **generate-application** skill reads to score jobs and write CVs. It is a **generated artifact** — the source of truth is the site data under `src/_data/` and the case studies under `src/work/`. This skill regenerates it so the two never drift.

All paths below are relative to the project root (`kjgarza.github.io/`).

**This skill is `kristian`-only, by construction.** It derives a profile from this site's own `src/_data/` modules, which describe Kristian. Other profiles (`.claude/profiles/<id>/`) maintain their profile documents by hand; there is nothing here to regenerate for them. Because the generated file is one of the baselined references, run `scripts/validate-profiles.sh --update-baseline` after a regeneration and commit the new baseline alongside it — otherwise the regression check will flag the legitimate change.

## Run (agent path)

The driver is `.claude/skills/generate-kristian-profile/driver.mjs`. It reads the data modules, parses the case studies, and writes the profile.

Preview without touching the file (prints full markdown to stdout — diff it against the current profile first):

```bash
node .claude/skills/generate-kristian-profile/driver.mjs --check | head -40
```

Write it for real:

```bash
node .claude/skills/generate-kristian-profile/driver.mjs
```

Expected output:

```
profile written → .claude/skills/generate-application/references/kristian-profile.md (13.9 KB)
sources: 7 case studies, 19 publications, 7 side projects, 42 skills
```

Write somewhere else (e.g. to compare):

```bash
node .claude/skills/generate-kristian-profile/driver.mjs -o /tmp/profile-new.md
```

## What it pulls from where

| Profile section | Source |
|---|---|
| Identity (name, role, ORCID, languages) | `src/_data/site.js` (`author`, `schema_org`) |
| Positioning statement | `src/_data/site.js` (`description`, `bio`) |
| Employment history | `src/_data/cv.js` (`employment`) |
| Case study proof points (summary, highlights, metrics, tech) | `src/_data/work.js` order → each `src/work/<slug>.md` |
| Technical stack (bucketed) | `src/_data/cv.js` (`skills`) |
| Publications (grouped by theme) | `src/_data/publications.js` |
| Side projects | `src/_data/tools.js` |
| Education | `src/_data/cv.js` (`education`) |

Case study extraction keys off the case studies' consistent headings: `## Overview` → summary, `### Technology Stack` → tech, `## Key Achievements` → highlights, bold numeric spans (`**70%**`, `**50,000-dataset**`) → metrics.

## After running

Regenerating overwrites any hand edits — the file carries a "do not hand-edit" banner. If the profile needs a fact that isn't in the data, add it to the **source** (`src/_data/*`) or the driver, not the output file.

Two sections are **not** data-derived — they're positioning decisions, kept as constants at the top of `driver.mjs`: `TARGET_ROLE` (seniority, arrangement, Track A/B) and `POSITIONING_FRAMES` (frame → lead-evidence table). Edit those constants to change them; they survive regeneration.

## Gotchas

- **Case study body is prose, not structured fields.** Highlights come from the `## Key Achievements` bullets; metrics come only from **bold** numeric spans. A case study with no `## Key Achievements` section (e.g. `redesigning-datacite-harvesting-services.md`, `creating-a-design-system.md`) yields a Summary-only block — that's expected, not a failure. To enrich it, add a `## Key Achievements` list to the `.md`.
- **The bold-span metric regex is single-line by design.** `**...**` spanning a newline is ignored — an earlier version captured multi-paragraph blobs. If a real metric goes missing, check it's bold and on one line in the source.
- **`--check` prints, does not write.** Always the safe first move; the file is only touched by the argument-less run.
- **`gray-matter` must resolve.** It's an Eleventy dependency, present after `bun install`. If missing: `bun install`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot find module 'gray-matter'` | `bun install` (it ships with Eleventy) |
| `Cannot find module '.../src/_data/cv.js'` | Run from the project root, or check the file exists |
| A case study block is missing highlights | The `.md` has no `## Key Achievements` section — add one |
| Skill name shows under `Other` in Technical Stack | Add a keyword match to the `buckets` map in `driver.mjs` |
