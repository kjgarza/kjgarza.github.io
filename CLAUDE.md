# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This is an [Eleventy (11ty)](https://www.11ty.dev/) static site. Use **Bun** as the package manager and runtime.

```bash
bun run dev        # Start dev server with live reload (http://localhost:8080)
bun run build      # Build for production → _site/
bun run watch      # Watch and rebuild without serving
bun run clean      # Remove _site/ and node_modules/
bun run reinstall  # Clean + reinstall dependencies
```

Via `just` (requires [just](https://github.com/casey/just)):
```bash
just dev           # Same as bun run dev
just build         # Same as bun run build
just serve         # Serve _site/ with python3 http.server on :8080
```

No linter or test suite is configured.

## Architecture

### Tech stack
- **Eleventy 3.x** with **Nunjucks** as the primary template engine (`autoescape: false`)
- CSS is pre-built and served as a static asset from `src/_next/static/css/` (Tailwind output, not compiled during build)
- No JavaScript bundler — scripts are static files in `src/assets/`

### Directory layout

```
src/
  _data/          # Global data files (JS modules) — auto-injected into all templates
  _includes/
    layouts/      # Page layouts (base.njk, case-study.njk)
    components/   # Partials (nav.njk, footer.njk, work-card.njk, tool-card.njk)
  assets/         # Images, static CSS/JS — passthrough copied to _site/
  drawings/       # SVG decorations — passthrough copied to _site/
  _next/          # Pre-built CSS bundle — passthrough copied to _site/
  static/api/     # Static JSON API responses — copied to _site/api/
  work/           # Case study markdown files (one per project)
  *.njk           # Top-level pages: index, work, tools, publications, playground
_site/            # Build output (gitignored)
```

### Data layer (`src/_data/`)

All files export plain JS arrays/objects consumed as global template variables:

| File | Variable | Purpose |
|------|----------|---------|
| `site.js` | `site` | Author info, bio, GA code, schema.org |
| `work.js` | `work` | Portfolio items with metadata for the grid |
| `tools.js` | `tools` | Side-project tools shown on homepage + /tools |
| `publications.js` | `publications` | Academic publications list |
| `navigation.js` | `navigation` | Nav links array |

### Pages and routing

- **`/`** (`index.njk`) — Homepage: hero text, bio sections, featured work grid, tools preview
- **`/work`** (`work.njk`) — All work items from `work.js`
- **`/work/:slug/`** — Individual case studies from `src/work/*.md`, using `layout: layouts/case-study.njk`
- **`/tools`** (`tools.njk`) — All tools from `tools.js`
- **`/publications`** (`publications.njk`) — All publications from `publications.js`

### Adding a new case study

1. Add an entry to `src/_data/work.js` with `id`, `title`, `description`, `tags`, `status`, `link`, `featured`, and optional `image`/`gridClass` fields
2. Create `src/work/<slug>.md` with frontmatter: `layout: layouts/case-study.njk`, `title`, `description`, `company`, `tags`, `heroImage`, `permalink`, and optionally `passwordProtected: true`

### CSS / Styling

Tailwind utility classes are used throughout templates but the CSS is pre-compiled — **do not run a Tailwind build step**. The compiled bundle lives at `src/_next/static/css/b79f6ce842955dc5.css` and is referenced directly from `base.njk`. To change styles, edit the bundle or regenerate it externally.

### Static API passthrough

`src/static/api/` is copied verbatim to `_site/api/`, enabling static JSON endpoints (e.g. `/api/user.json`).

### Contact form

The "Get in touch" button uses [Tally](https://tally.so) embedded forms (`data-tally-open="3XjAKz"`). The Tally embed script is loaded in `base.njk`.

## Job Search Pipeline

This repo doubles as a job-search system. The orchestrator is the `job-pipeline` skill — prefer it over invoking the lower-level skills directly.

- **Profiles**: the skills are profile-parameterized. `.claude/profiles/<id>/config.json` holds everything candidate-specific (reference files, storage paths, CV mode, target titles). Resolution order: `--profile <id>` → `$JOB_PROFILE` → the profile with `"default": true`, currently `kristian`. So a bare `/job-pipeline` is still Kristian's pipeline, unchanged. Second profile: `claudia` (Customer Success / Account Management). See `.claude/profiles/README.md`.
- **Storage**: each profile's `storage` paths are untracked, gitignored symlinks into an external storage dir — the real data lives outside the repo entirely. This keeps comp/PII data out of the repo tree (archiving/zipping the repo folder no longer sweeps it up) and every clone/worktree points at the same physical copy. Run `scripts/setup-storage.sh` once per clone or worktree (default root `/Volumes/Verbatim-Vi560-Media/Development/employment-jobs`, override with `$EMPLOYMENT_JOBS_DIR`); it links every path every profile declares. Kristian: `leads/`, `applications/`. Claudia: `claudia/leads/`, `claudia/applications/`, `claudia/cv/`.
- **This repo is public.** A profile for anyone other than Kristian keeps its PII-bearing files (profile, decision policy, CV) in external storage, never in the tree. `scripts/validate-profiles.sh` fails the build if such a file becomes tracked.
- **State ledger**: `<leads>/pipeline.json` — one ledger per profile, single source of truth, keyed by job URL. Read it before fetching/scoring/preparing any job; update it after. Never redo work for a URL already in it.
- **Decision policy**: `references.decisionPolicy` from the profile config — goals, comp targets, auto-prepare thresholds. Kristian's is `.claude/skills/job-pipeline/references/decision-policy.md`; Claudia's is `claudia/decision-policy.md`. Unattended decisions follow that file, and a `[FILL ME]` in it blocks the corresponding form answer.
- **Skill chain**: `job-pipeline` → `find-kristian-jobs` (search/score) → `generate-application` (analysis, CV, cover letter, application-questions.md) → `find-linkedin-contacts` (outreach). Whichever profile the pipeline resolved is passed down the chain.
- **Packages**: `<applications>/YYYY-MM-DD-[company]-[role-slug]/` — every package must include `application-questions.md` (draft answers for the actual ATS form; questions come from `fetch-application-form.sh`, falling back to `fetch-job.sh` `.questions`).
- **CV output** depends on `cv.mode`: `data-driven` (Kristian) generates `cv-data.js` and renders `[slug].pdf`; `static-pdf` (Claudia) skips both and writes `cv-tailoring-notes.md` against the existing PDF at `cv.file`.
- **Regression check**: `scripts/validate-profiles.sh` — asserts Kristian's reference files are byte-identical to `.claude/profiles/kristian/reference-baseline.sha256`, the default profile is still `kristian`, no profile can read another's files, and no PII is tracked. Run it after touching any skill or profile file. Intentional edits to Kristian's references: `scripts/validate-profiles.sh --update-baseline`, committed alongside the edit.
- **Hard rule**: never submit an application or send outreach without explicit human approval.
