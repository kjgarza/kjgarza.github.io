# CLAUDE.md

Shared instructions for coding agents. `AGENTS.md` is a symlink to this file, so Codex, Cursor and others read the same content.

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

No linter is configured. `bun test` runs `tests/*.test.js(x)`. `tests/seo.test.js` builds the site and checks SEO invariants on `_site/`: canonicals, escaped meta tags, one H1 per page, descriptions of at most 160 characters, noindex/sitemap rules, structured data, and image attributes. Run it after touching layouts, front matter or `src/_data/`. The `tests/ask-*` files cover the `/ask/` page (see below) and never call a live model.

`just test` runs everything; `just test-scripts` (`uvx pytest`) runs only the job-pipeline script tests, offline and in seconds. Run it after touching anything in `scripts/` or a skill's `scripts/`.
- `tests/cv-to-pdf.test.js` (bun) renders the site CV through `scripts/cv-to-pdf.js` without launching Chrome.
- `tests/test_*.py` (pytest) cover `check-postings.py`, `cordis-leads.py`, `setup-storage.sh` and the skill shell scripts. Shell scripts run against `tests/fakecurl.py`, a fake `curl` serving canned API responses, so no test touches the network.
- `tests/test_ledger_contract.py` checks the real `leads/pipeline.json` and skips when it is absent (CI). Never commit ledger data as fixtures: this repo is public.
- `xfail(strict=True)` tests pin known bugs and copy drift. Fixing one makes it fail, which is the cue to drop the mark.

## Architecture

### Tech stack
- **Eleventy 3.x** with **Nunjucks** as the primary template engine (`autoescape: false`)
- **Tailwind CSS v4**, compiled from `src/styles/tailwind.css` on every Eleventy build (see CSS / Styling)
- No JavaScript bundler — scripts are static files in `src/assets/`. One page-scoped exception: `/ask/` loads `src/assets/js/ask.js`, bundled from `lib/ask/` by `bun run build:ask` (run by `build`, `dev`, `watch` and `build-ghpages`; the output is gitignored). Every other page stays zero-React static HTML.

### Directory layout

```
src/
  _data/          # Global data files (JS modules) — auto-injected into all templates
  _includes/
    layouts/      # Page layouts (base.njk, case-study.njk)
    components/   # Partials (nav.njk, footer.njk, work-card.njk, tool-card.njk)
      ui/         # shadcn-style macros (button.njk, badge.njk)
  assets/         # Images, static CSS/JS — passthrough copied to _site/
  drawings/       # SVG decorations — passthrough copied to _site/
  styles/         # tailwind.css — Tailwind v4 source, compiled to _site/assets/css/site.css
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
- **`/ask/`** (`ask.njk`) — "Ask about my work": a question box that streams a generated answer (see Ask page)

### Adding a new case study

1. Add an entry to `src/_data/work.js` with `id`, `title`, `description`, `tags`, `status`, `link`, `featured`, and optional `image`/`gridClass` fields
2. Create `src/work/<slug>.md` with frontmatter: `layout: layouts/case-study.njk`, `title`, `description`, `company`, `tags`, `heroImage`, `permalink`, and optionally `passwordProtected: true`
   - `description` over 160 characters → also add a shorter `metaDescription` for search snippets.
   - `passwordProtected: true` pages are `noindex` and left out of the sitemap unless they set `publicSummary` (plain text with blank-line-separated paragraphs, shown above the gate).
   - Put images in `src/assets/images/` and embed them as plain markdown `![alt](/assets/images/x.png)`. A build transform turns them into responsive `<picture>` markup, and the markdown mirrors keep the plain links. Don't hotlink external images.

### SEO head

`components/seo-head.njk` renders the title, description, canonical, robots, Open Graph and Twitter tags for both layouts. Front matter it reads: `metaTitle` (full `<title>` override), `title` (gets ` — Kristian Garza` appended unless `appendSiteName: false`, which case studies set), `metaDescription`/`description`, `heroImage` (becomes `og:image`), `noindex`, and `structuredData` (extra JSON-LD).

### CV pages

`/cv/` renders only the default CV (`src/_data/cv.js`). Employer-specific variants are listed in `src/_data/cvVariants.js` and render at `/cv/<id>/`. Those pages are noindex, left out of the sitemap, and not linked from the site. The sheet markup is the `renderCV` macro in `components/cv-sheet.njk`, which `scripts/cv-to-pdf.js` also uses.

### Ask page

`/ask/` answers a visitor's question with [json-render](https://github.com/vercel-labs/json-render) generative UI. The model picks, the data renders: every component prop is an id from the site data, and the only free text is a short `Answer`.

- `lib/ask/site-data.js` builds `/api/ask-data.json` (via `src/ask-data.11ty.js`) from `work.js`, `publications.js`, `tools.js`, `cv.js` employment and the public case studies (H2 sections and excerpts). `passwordProtected: true` case studies are left out entirely. The page script and the endpoint both read this file.
- `lib/ask/catalog.mjs` defines the catalog (`Stack`, `Answer`, `WorkCard`, `Publication`, `CaseStudyExcerpt`, `Timeline`, `ToolCard`, `ContactCTA`) with ids as Zod enums, plus `validateAskSpec`.
- `lib/ask/registry.jsx` renders it with the markup and Tailwind classes of the Nunjucks components. Tailwind scans `lib/ask/` too (`@source` in `tailwind.css`), and a test checks every class it renders gets CSS.
- `lib/ask/server.mjs` is the endpoint: CORS limited to the site origin, a per-IP rate limit, the catalog prompt plus `/llms-full.txt` and the id lists as a cached system prompt, capped output, and a filter that drops any streamed patch outside the catalog. `worker/ask/` deploys it as a Cloudflare Worker (`just deploy-ask`; API key via `wrangler secret put ANTHROPIC_API_KEY`; set a monthly spend limit on the Anthropic workspace).
- The site gets the Worker URL from `ASK_ENDPOINT` at build time (a repo variable in the deploy workflow). Without it, `/ask/` ships as the suggested-question links only, which is also the no-JS fallback.
- json-render is pre-1.0: dependency versions are pinned exactly. Read the release notes before upgrading.

### CSS / Styling

Tailwind v4 compiles `src/styles/tailwind.css` to `_site/assets/css/site.css` in an `eleventy.before` hook (`.eleventy.js`, ~200 ms), so any utility class added to a template gets CSS on the next build. `base.njk` links it through the `cssUrl` filter, which appends a content hash for cache busting. Tailwind scans only `src/` (`source(none)` + `@source ".."`).

- Colour tokens use **shadcn/ui names** (`--background`, `--foreground`, `--card`, `--muted-foreground`, `--primary`, `--border`, `--ring`, …), defined in that file and exposed as utilities through `@theme inline`. Use `text-foreground`, `text-muted-foreground`, `text-primary` (brand pink, AA-safe #d6005a in light mode), `bg-background`, `bg-card`, `border-border`, `hover:border-border-strong`, `fill-decoration`. `--border-strong` and `--decoration` are site extras. Add new tokens there, not as hex values in templates.
- Dark mode is `[data-theme=dark]` or `.dark` on `<html>` (`dark:` variant); nothing sets it yet.
- Case studies also load `src/assets/css/case-study.css` (plain CSS, `cs-*` classes).
- **Basecoat** (`basecoat-css`, shadcn/ui ported to plain HTML) provides heavier components. Import only what's used at the top of `tailwind.css` (`@import "basecoat-css/components/<name>"`) and copy its JS from `node_modules/basecoat-css/dist/js/` with a passthrough in `.eleventy.js`. Today: the **drawer** (shadcn Sheet) for the mobile menu in `components/nav.njk`, a `<dialog class="drawer">` opened with `showModal()`. `body > :not(dialog)` in `base.njk` keeps the background-lift rule off dialogs.
- Buttons and tag pills come from the macros in `components/ui/`, shadcn-style variant maps. Use them instead of copying class strings:
  `{% from "components/ui/button.njk" import button %}` then `{% call button("secondary", href=url, class="w-fit") %}Label{% endcall %}` (variants `primary | secondary | ghost`, sizes `default | icon`, raw attributes via `attrs='type="button"'`), and `{% from "components/ui/badge.njk" import badge %}` then `{{ badge(tag) }}` (variants `outline | blue | green | purple | neutral`).

### Static API passthrough

`src/static/api/` is copied verbatim to `_site/api/`, enabling static JSON endpoints (e.g. `/api/user.json`).

### Contact form

The "Get in touch" button uses [Tally](https://tally.so) embedded forms (`data-tally-open="3XjAKz"`). The Tally embed script is loaded in `base.njk`.

## Job Search Pipeline

This repo doubles as Kristian's job-search system. The orchestrator is the `job-pipeline` skill — prefer it over invoking the lower-level skills directly.

- **Storage**: `leads/` and `applications/` are untracked, gitignored symlinks into an external storage dir — the real data lives outside the repo entirely. This keeps personal comp/PII data out of the repo tree (archiving/zipping the repo folder no longer sweeps it up) and every clone/worktree points at the same physical copy. The location is configurable: run `scripts/setup-storage.sh` (default `/Volumes/Verbatim-Vi560-Media/Development/employment-jobs`, override with `$EMPLOYMENT_JOBS_DIR`). Run it once per clone or worktree — the symlinks are no longer tracked, so `git worktree add` does not recreate them. Skills read/write the relative `leads/...` `applications/...` paths as before; nothing in skill code changed.
- **State ledger**: `leads/pipeline.json` — single source of truth, keyed by job URL. Read it before fetching/scoring/preparing any job; update it after. Never redo work for a URL already in it.
- **Decision policy**: `.claude/skills/job-pipeline/references/decision-policy.md` — goals, comp targets, auto-prepare thresholds. Unattended decisions follow this file.
- **Skill chain**: `job-pipeline` → `find-kristian-jobs` (search/score) → `generate-application` (analysis, cv-data.js, cover letter, application-questions.md) → `find-linkedin-contacts` (outreach).
- **EU-funding outreach**: `/job-pipeline cordis` runs `scripts/cordis-leads.py` — ranks organisations winning Horizon Europe money in the AI × research-ecosystem niche and lists open calls, into `leads/cordis/`. Cold-outreach targets, not postings; kept out of `pipeline.json`.
- **Packages**: `applications/YYYY-MM-DD-[company]-[role-slug]/` — every package must include `application-questions.md` (draft answers for the actual ATS form; questions come from `fetch-application-form.sh`, falling back to `fetch-job.sh` `.questions`).
- **Hard rule**: never submit an application or send outreach without explicit human approval.
