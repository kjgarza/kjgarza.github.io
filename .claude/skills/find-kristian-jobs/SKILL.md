---
name: find-kristian-jobs
description: Search for jobs and prepare application materials. Use when asked to find jobs, search job boards, match jobs to skills, prepare cover letters, or help with job applications. Profile-parameterized: defaults to Kristian Garza, pass --profile <id> (e.g. claudia) to search for another candidate.
argument-hint: "[--profile <id>]"
---

# Find Jobs

A job search agent for the resolved candidate profile. Its job is to find, analyze, and prepare application materials for roles matching that candidate.

Under the default profile (`kristian`) this is a search for **Kristian Garza**, a Senior AI Engineer at Digital Science based in Berlin, targeting above-senior roles (Lead, Principal, Staff, Manager, Director) that match his rare cross-disciplinary profile.

## Step 0 — Resolve the Profile

Resolve which candidate this run is for **before** searching:

1. `--profile <id>` in the invocation wins.
2. Otherwise `$JOB_PROFILE` from the environment.
3. Otherwise the profile with `"default": true` (currently `kristian`).

Read `.claude/profiles/<id>/config.json`. Its `references` block gives `<searchProfile>`, `<targetCompanies>`, and `<scoringMatrix>`; its `search` block gives the titles and locations to query for. All config paths are repo-root-relative. If the id is unknown or a reference file is missing, stop and name it — never search on another candidate's profile. See `.claude/profiles/README.md`.

A bare invocation resolves to `kristian`, so it behaves exactly as it did before profiles existed.

Everything below describes the `kristian` search in concrete terms: target seniority, tech keywords, tier definitions, scoring signals. Under another profile keep the **method** (budgets, freshness rules, board sweeps, dedup and scoring discipline) and take the **substance** from that profile's reference files and its `search.titles` / `search.locations`.

## Reference Files

Before proceeding, read these reference files for full context:
- `<searchProfile>` — Complete candidate profile with proof points, tech stack, publications, and positioning frames (`kristian`: `references/kristian-profile.md`)
- `<targetCompanies>` — Curated target company list across three tiers (`kristian`: `references/target-companies.md`)
- `references/job-sources.md` — Which sources to sweep and the cheapest correct way to read each (board API slugs, Google/Jina, browser, WebSearch). Profile-agnostic, shared by every profile

## Scripts

Bundled helper scripts live in the `scripts/` subfolder of this skill:

| Script | Purpose |
|--------|---------|
| `scripts/fetch-board.sh <ats> <board>` | List an **entire company job board** in one call: `{ats, board, count, jobs[]}` with `posted_date` per role. `ats` = `ashby` \| `greenhouse` \| `lever` \| `google`. Board slugs are in `references/job-sources.md`. Google mode takes a query + location instead of a slug. Free — not counted against the career-page budget. |
| `scripts/fetch-job.sh <url> [<url> ...]` | Fetch job postings and return `{url, posted_date, status, content}` JSON — an object for one URL, an array (in argument order) for several. Auto-selects: Greenhouse API → Lever API → Ashby single-posting API → Jina Reader → plain curl. **Pass the whole shortlist in one call** — it fetches them concurrently (~4x faster than a shell loop); `--jobs N` tunes parallelism, default 6. |
| `scripts/fetch-application-form.sh <url>` | Find the **apply deep link** and extract the actual application form questions. Returns `{url, ats, apply_url, source, needs_browser, questions, form_text}` JSON. Structured questions via Greenhouse/Workable/Ashby public APIs; apply-page scraping for Lever/generic. When `needs_browser: true` the form wasn't captured — open `apply_url` with browser tools. |
| `scripts/run-job-search.sh` | Run a full unattended search (cron/remote trigger). Invokes Claude in `bypassPermissions` mode and sends a push notification when done. |

## Search Budget (Hard Limits)

**Stop and present results when any limit is hit — do not continue searching.**

| Limit | Cap |
|-------|-----|
| Total WebSearch queries (across all agents) | 15 |
| Total job postings fetched & parsed | 20 |
| Total subagents spawned (Mode 1) | 3 |
| Career pages fetched **in a browser** per agent | 5 |
| Board API calls (`fetch-board.sh ashby\|greenhouse\|lever`) | **unlimited — one curl each; never skip one to save budget** |
| Google Careers keyword queries (`fetch-board.sh google`) | 3 per run — one of which is always the `DeepMind` London query |

If limits are reached before finding enough matches, report what was found and note the cap was hit.

## Freshness Rules (Hard Filters)

**Apply these before scoring — discard any posting that fails either check.**

| Rule | Action |
|------|--------|
| Posting is marked **Closed**, **Filled**, **No longer accepting**, or equivalent | Discard immediately |
| Posting date is **older than 5 months** from today | Discard immediately |
| No date is visible and content signals the role is no longer available | Discard with a note |

When parsing a posting with Jina Reader, always look for: `Posted`, `Date posted`, `Listed`, `Apply by`, `Closes`, or any timestamp field. If the posting date cannot be determined, flag it as **date unknown** and deprioritize — do not include it in scored results unless it is the only option for a strong domain match.

### Source-specific overrides

| Source | Override |
|--------|----------|
| **Ashby** boards | `publishedAt` is a true publish date — apply the 5-month rule strictly. Also discard `isListed: false`. Ashby boards keep **zombie postings**: still listed, published years ago (Elicit lists a 2021 ML Engineer role). The date rule catches these; don't trust `listed` alone. |
| **Greenhouse** boards | Only `updated_at` is exposed. Read it as "not older than" — a role can be older than its `updated_at` but never newer. Don't treat it as a publish date when reporting. |
| **Google Careers** | **Google publishes no date anywhere** — not on the results page, not on the posting. The blanket "deprioritize unknown dates" rule would silently kill every Google role, so it does **not** apply here. Instead: `fetch-board.sh google` requests `sort_by=date`, so treat the returned order as the freshness proxy, take the top results, and score them normally with `posted_date: unknown (Google — no date published)`. |

### Geography pre-filter

Run this **before** fetching a posting's full content, so budget isn't spent on roles that can't score:

- **Discard** US-only roles and US-timezone-locked remote roles (e.g. "Oakland, CA (or remote within US timezones)"). Work arrangement is 15% of the score and these cap out around 60%.
- **Keep** anything mentioning EMEA, Europe, Germany, Berlin, "remote (global)", or a European secondary location.
- Report what the filter dropped per company — never silently drop an entire employer.

## Tool Stack

| Task | Tool |
|------|------|
| Search for jobs | `WebSearch` |
| **List a whole company board (preferred)** | `Bash`: `bash .claude/skills/find-kristian-jobs/scripts/fetch-board.sh <ats> <board>` — slugs in `references/job-sources.md` |
| Fetch career pages (JS-heavy, **only when no board API exists**) | `mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__get_page_text` |
| Search LinkedIn Jobs (authenticated) | `mcp__claude-in-chrome__*` browser tools |
| Parse job posting content | `Bash`: `bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "[url]"` |
| Fetch application form + questions | `Bash`: `bash .claude/skills/find-kristian-jobs/scripts/fetch-application-form.sh "[url]"` |
| Read a JS-only or login-walled apply form | `mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__get_page_text` on the `apply_url` |
| Fallback fetch | `WebFetch` |

**URL Caching with qurl — check before every fetch:**
```bash
qurl get "<url>"   # exits 0 with content if cached; exits 1 if not found
```
- Exit 0: use returned content directly. Skip Jina/WebFetch.
- Exit 1: proceed with Jina or WebFetch, then index the result:
```bash
echo "<fetched_content>" | qurl add "<url>"
```
Applies to: job posting URLs, career page URLs, company about/team pages.

**Jina Reader pattern:** `curl -H "Authorization: Bearer $JINA_API_KEY" "https://r.jina.ai/[url]"` — use for every job posting URL to get clean markdown fast. Always preferred over raw WebFetch.
**Job fetch pattern** — use for every job posting URL. Returns structured JSON with `posted_date` and `status` pre-extracted:

```bash
RESULT=$(bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "$JOB_URL")
POSTED_DATE=$(echo "$RESULT" | jq -r '.posted_date')   # YYYY-MM-DD or "unknown"
STATUS=$(echo "$RESULT"     | jq -r '.status')          # "open", "closed", or "unknown"
CONTENT=$(echo "$RESULT"    | jq -r '.content')
```

The script auto-selects the best source: **Greenhouse API → Lever API → Ashby single-posting API → Jina Reader → plain curl**. Always preferred over raw `curl` or `WebFetch`.

**Fetching more than one posting? Pass them all to a single call** — it fetches concurrently and returns an array in argument order, instead of paying each round-trip serially:
```bash
bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "$URL_A" "$URL_B" "$URL_C" | jq -r '.[] | "\(.posted_date) \(.status) \(.url)"'
```

## Output

Always save results to a markdown file under `leads/` at the repository root, in addition to displaying them in the conversation.

### Directory Structure

```
leads/
  YYYY-MM-DD-search.md             # Full Search results
  [company-slug]/                  # One folder per company (kebab-case, e.g. "chan-zuckerberg")
    YYYY-MM-DD-search.md           # Company Search results
    YYYY-MM-DD-[role-slug]-analysis.md      # Deep Analysis output
    YYYY-MM-DD-[role-slug]-application.md   # Application Package output
    YYYY-MM-DD-[role-slug]-contacts.md      # find-linkedin-contacts output (written by that skill)
```

### Path Rules

| Mode | Output Path |
|------|-------------|
| **Full Search** | `leads/YYYY-MM-DD-search.md` |
| **Company Search** | `leads/[company-slug]/YYYY-MM-DD-search.md` |
| **Deep Analysis** | `leads/[company-slug]/YYYY-MM-DD-[role-slug]-analysis.md` |
| **Application Package** | `leads/[company-slug]/YYYY-MM-DD-[role-slug]-application.md` |

- `[company-slug]` = company name in kebab-case (e.g. `digital-science`, `chan-zuckerberg`)
- `[role-slug]` = job title in kebab-case (e.g. `staff-ai-engineer`, `head-of-platform`)
- Create parent directories as needed (`mkdir -p`).
- After writing the file, tell the user the exact path.

## Command Routing

| Input | Mode |
|-------|------|
| `/find-kristian-jobs` (no args) | **Full Search** — spawn 3 parallel subagents |
| `/find-kristian-jobs [company name]` | **Company Search** — targeted search at a specific company |
| `/find-kristian-jobs analyze [job URL]` | **Deep Analysis** — score and analyze a specific posting |
| `/find-kristian-jobs prepare [job URL]` | **Application Package** — generate full application materials |

---

## Mode 1: Full Search

### Step 1 — Spawn 3 Parallel Subagents

**Spawn all 3 agents simultaneously using the Task tool.** Each agent operates independently within its budget. Do not wait for one to finish before spawning the next.

---

**Agent 1 — Board APIs + Google + Career Pages + LinkedIn Browser**

Budget: max 5 **browser** career page fetches + LinkedIn browser search. Board API calls are free and don't count.

0. **Sweep the board APIs first.** Read `references/job-sources.md` for the slug table, then run one call per company — these return every open role with a real posted date and cost nothing:
   ```bash
   S=.claude/skills/find-kristian-jobs/scripts/fetch-board.sh
   bash $S ashby openai;      bash $S greenhouse anthropic
   bash $S greenhouse deepmind; bash $S ashby cohere
   bash $S ashby elicit;      bash $S greenhouse chanzuckerberginitiative
   bash $S ashby langchain;   bash $S ashby notion
   bash $S ashby replit;      bash $S greenhouse vercel
   bash $S greenhouse elsevier
   ```
   Boards are large (OpenAI ~740, Anthropic ~400) — filter titles/locations in `jq` before returning anything. Apply the geography pre-filter and the 5-month rule to `posted_date` here, not later.

   **Do not browser-scrape openai.com or anthropic.com career pages** — these boards supersede them.

0b. **Google Careers** (max 3 keyword queries — the two below plus the mandatory `DeepMind` one; never a bare location dump, it returns mostly Cloud sales):
   ```bash
   bash $S google "machine learning" "Berlin Germany"
   bash $S google "research infrastructure" "Germany"
   bash $S google "DeepMind" "London UK"
   ```
   Results carry `posted_date: unknown` by design (Google publishes none) and are ordered newest-first. Keep them; the freshness override in this skill exempts Google.

   **Google DeepMind needs BOTH sources — sweep each:** the `deepmind` Greenhouse board carries only US roles (Mountain View / NYC / Seattle), and DeepMind's **London** roles are on Google Careers, reachable only via the `DeepMind` keyword query above. Skipping either one silently drops half of a Tier 1 company. See `references/job-sources.md` §2.

1. Use `mcp__claude-in-chrome__navigate` to open each **remaining** career page (companies with no board API), then `mcp__claude-in-chrome__get_page_text` to extract roles:
   - `https://holtzbrinck.com/en/jobs`
   - `https://careers.merantix-aicampus.com/jobs?filter=eyJzZWFyY2hhYmxlX2xvY2F0aW9ucyI6WyJCZXJsaW4sIEdlcm1hbnkiXX0%3D` (Merantix AI Campus network, Berlin-filtered — covers Merantix Momentum and portfolio companies)
   - On each career page, check for a "posted date" or "last updated" field; skip any role posted more than 5 months ago or marked closed.
   - The Merantix board runs on the Getro ATS, which `fetch-job.sh` does not handle and which 403s plain `curl` — always use the browser path for it.
2. Search LinkedIn Jobs via browser (filtered to past 5 months, ≈150 days = 12 960 000 s):
   - Navigate to `https://www.linkedin.com/jobs/search/?keywords=AI+Engineer+research+infrastructure&location=Europe&f_TPR=r12960000`
   - Use `mcp__claude-in-chrome__get_page_text` to extract job titles, companies, URLs, **and posted dates**
   - Run 1–2 additional LinkedIn searches varying keywords (Staff Engineer LLM, Head of AI open science) using the same `f_TPR=r12960000` filter
   - Discard any result where LinkedIn shows "Closed" or a posted date older than 5 months
3. Return: list of `{title, company, url, posted_date}` objects — include `posted_date` whenever visible

---

**Agent 2 — Track A: AI Labs (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5.

Queries (pick the most relevant 5):
- `"AI Engineer" OR "ML Engineer" research infrastructure remote Europe 2026`
- `"Staff Engineer" OR "Principal Engineer" LLM knowledge graph remote 2026`
- `"Head of AI" OR "Director of AI" open science remote Europe 2026`
- `"Engineering Lead" developer tools research remote Europe 2026`
- `Anthropic OR OpenAI OR "Google DeepMind" OR "Mistral AI" careers AI engineer Europe 2026`
- `"Merantix Momentum" OR "Merantix AI Campus" careers machine learning engineer Berlin 2026`

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects found in search results (`posted_date` = date from snippet, or `unknown`).

---

**Agent 3 — Track B: Research Infrastructure (WebSearch)**

Budget: max 5 WebSearch queries. Stop after 5.

Queries:
- `"Senior Engineer" OR "Lead Engineer" scholarly infrastructure remote 2026`
- `"Staff Engineer" OR "Principal Engineer" open science remote Europe 2026`
- `"Head of Engineering" research data infrastructure remote 2026`
- `"Engineering Manager" scientific publishing technology remote 2026`
- `"Chan Zuckerberg" OR "Crossref" OR "ORCID" OR "Allen Institute" OR "Hugging Face" careers engineering 2026`

For each result, note the date shown in the search snippet. Discard any result whose snippet date is older than 5 months or whose title/snippet signals the role is closed.

Return: list of `{title, company, url, posted_date}` objects (`posted_date` = date from snippet, or `unknown`).

---

### Step 2 — Deduplicate, Filter Freshness, and Parse

Collect all results from the 3 agents. Deduplicate by URL. If total > 20, keep the 20 most relevant by title/company.

**Freshness filter — run before parsing:**
1. For each posting, check any date metadata already returned (LinkedIn `f_TPR` filter, search snippet dates, `posted_date` from agents).
2. Discard postings with a known date older than **5 months** from today.
3. Discard postings explicitly marked closed/filled, and Ashby postings with `listed: false`.
4. If the date is unknown, proceed to parse — but flag `posted_date: unknown`. **Exception: Google roles keep full priority despite an unknown date** (see Source-specific overrides).
5. Apply the **geography pre-filter** — drop US-only / US-timezone-remote roles before spending a fetch on them.

Fetch the full content of all surviving postings in **one batched call** — not a loop. The batch runs concurrently and returns an array in argument order:
```bash
RESULTS=$(bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "${JOB_URLS[@]}")
echo "$RESULTS" | jq -r '.[] | "\(.posted_date) | \(.status) | \(.url)"'
# one posting's body:
echo "$RESULTS" | jq -r '.[0].content'
```
A serial loop pays every network round-trip end to end; the batch finishes in about the time of its slowest posting (measured ~4x faster on a 6-URL shortlist).

After fetching, re-apply the freshness filter using the returned `posted_date` and `status` fields:
- Look for fields: `Posted`, `Date posted`, `Listed`, `Apply by`, `Closes`, `Deadline`.
- If the extracted date is older than 5 months, **discard the posting** and do not score it.
- If the posting content says "position filled", "no longer available", or "closed", **discard immediately**.

Always capture the direct URL and resolved `posted_date` — both must appear in the results table.

### Step 3 — Score (Multi-Dimensional)

| Dimension | Weight | Scoring Guide |
|-----------|--------|---------------|
| **Domain alignment** | 30% | Scholarly infra/open science = 100, AI/ML = 90, devtools = 80, knowledge management = 70, general SaaS = 30 |
| **Seniority fit** | 20% | Director/Head = 100, Principal/Staff = 90, Lead/Manager = 85, Senior = 50, Mid = 10 |
| **Skill stack overlap** | 20% | (matched skills / required skills) × 100. Key skills: LLMs, Python, FastAPI, distributed systems, UX research, design systems, Kubernetes, PID systems |
| **Work arrangement** | 15% | Remote Europe = 100, Berlin-based = 100, Remote global = 80, Hybrid Berlin = 70, Other EU city = 50, US-only = 0 |
| **Mission/culture** | 15% | Open source + research-driven = 100, mission-oriented = 80, commercial but ethical = 50, pure enterprise = 20 |

Filter to 60%+. Flag 80%+ as strong matches.

### Step 4 — Hidden Fit Detection

Flag postings where the title doesn't match but the description signals latent need:
- "AI Engineer" mentioning documentation, metadata, or knowledge management
- "Research Software Engineer" mentioning LLMs or NLP
- "Product Engineer" mentioning user research or design systems
- "Backend Engineer" mentioning scholarly, academic, or publishing

### Step 5 — Present Results

```
## Job Search Results — [date]

### Strong Matches (80%+)
| # | Role | Company | Score | Track | Posted | URL | Key Fit Signals |
|---|------|---------|-------|-------|--------|-----|-----------------|

### Good Matches (60-79%)
| # | Role | Company | Score | Track | Posted | URL | Key Fit Signals |
|---|------|---------|-------|-------|--------|-----|-----------------|

### Hidden Fit Opportunities
| # | Role | Company | Score | Posted | URL | Why Hidden Fit |
|---|------|---------|-------|--------|-----|----------------|
```

For each strong match (80%+): positioning frame, top 3 proof points, gaps, suggested angle.

### Step 6 — Contact Discovery (Auto-trigger for Strong Matches)

For every strong match (80%+), automatically invoke the `find-linkedin-contacts` skill:

> "Now finding contacts at [Company] for the [Role Title] role..."

Pass to `find-linkedin-contacts`:
- Company name
- Job title
- Job URL

This runs the full contact workflow: scrape company site, search LinkedIn, classify P1/P2/P3 contacts, draft messages, and output an outreach strategy. Results are appended to the same results file.

---

## Mode 2: Company Search

1. **Check `references/job-sources.md` for a board slug first.** If the company is listed, one `fetch-board.sh` call returns the whole board with dates — skip steps 1–2 entirely. If it isn't listed, probe the obvious slug against all three ATSes before falling back to a browser:
   ```bash
   S=.claude/skills/find-kristian-jobs/scripts/fetch-board.sh   # paths are relative to the repo root
   bash $S <ats> <slug>                                          # if already listed
   for ats in ashby greenhouse lever; do bash $S $ats <slug> | jq -c '{ats,count,error}'; done
   ```
   Add any new working slug to `references/job-sources.md`.
2. Otherwise: search `[company] careers engineering 2026`, then fetch the career page via browser (`mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__get_page_text`) or Jina Reader as fallback
3. **Apply freshness filter:** discard any role marked closed/filled or with a posted date older than 5 months. Flag roles with no visible date as `posted_date: unknown`.
4. List only open, recent roles in a table with `URL` and `Posted` columns (clickable markdown links)
5. Score each using the multi-dimensional matrix
6. For top 3: provide positioning frame, proof points, gaps
7. For any 80%+ match: invoke `find-linkedin-contacts` automatically

---

## Mode 3: Deep Analysis

1. Fetch the full posting: `bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "[url]"` — returns `{url, posted_date, status, content}` JSON
2. **Freshness check:** extract the posted date from the parsed content. If the role is closed or older than 5 months, **stop and report** — do not score. If date is unknown, note it and proceed with a warning.
3. Fetch the application form: `bash .claude/skills/find-kristian-jobs/scripts/fetch-application-form.sh "[url]"` — capture the `apply_url` and how many custom questions the form carries (this feeds the effort estimate and the Application Package)
4. Score with dimension breakdown
5. Determine positioning frame
6. Map every requirement to a proof point
7. Identify gaps honestly
8. Check for hidden fit signals
9. Recommend GO / STRETCH / PASS

```
## Deep Analysis: [Role] at [Company]

**Job URL**: [link]
**Apply URL**: [apply deep link or "not found — check manually"]
**Application Form**: [N custom questions / standard fields only / unreadable (JS or login wall)]
**Posted Date**: [date or "unknown"]
**Status**: Open / Closed / Unknown
**Overall Score**: XX%

### Dimension Breakdown
- Domain alignment (30%): XX — [reasoning]
- Seniority fit (20%): XX — [reasoning]
- Skill stack (20%): XX — [reasoning]
- Work arrangement (15%): XX — [reasoning]
- Mission/culture (15%): XX — [reasoning]

### Positioning Frame: [chosen frame]
### Requirement Mapping
| Requirement | Proof Point | Strength |
### Gaps & Stretch Areas
### Hidden Fit Signals
### Recommendation: [GO / STRETCH / PASS]
```

---

## Mode 4: Application Package

**A job ad is not the application.** The real form — screening questions, essay prompts, salary/visa/notice fields, required attachments — lives on the apply deep link. The package is not complete without it.

1. Run Deep Analysis (Mode 3)
2. If score >= 60%, fetch the application form:
   ```bash
   bash .claude/skills/find-kristian-jobs/scripts/fetch-application-form.sh "$JOB_URL"
   ```
   - `needs_browser: false` and `questions` non-empty → use them as the authoritative form
   - `needs_browser: true` → the form wasn't captured; open `apply_url` with `mcp__claude-in-chrome__navigate` + `mcp__claude-in-chrome__get_page_text` and read the rendered form (if browser tools are unavailable, extract questions from `form_text`, then try `WebFetch` on `apply_url`)
   - Still unreadable → include the `apply_url` in the package with an explicit "check the form manually before submitting" note — never silently skip it
3. Generate cover letter + resume talking points + approach angle + **application form answers** (see below)
4. Automatically invoke `find-linkedin-contacts` for this company+role

### Application Form Answers

For every question found in step 2, include a section in the package:

- **Essay/motivation questions** — full drafted answer per the cover letter rules (concrete metrics, honest, tone matched to culture; respect any stated word/character limit)
- **Factual questions** (salary expectation, notice period, visa/work authorization, start date) — answer from the profile if present; otherwise insert a `[FILL ME: …]` placeholder and list it in the summary — never guess personal facts
- **Yes/no screeners** — answer honestly from the profile; if an honest answer is a knockout risk, flag it prominently rather than fudging it
- **Standard fields** (name, email, CV upload, LinkedIn) — list them so nothing is a surprise at submit time; no draft needed

Record the `apply_url` and the form source (api / apply-page / browser / unreadable) at the top of the section.

### Cover Letter Structure
1. Opening hook — the most relevant intersection, not generic interest
2. Proof point 1 — strongest matching case study with concrete metrics
3. Proof point 2 — complementary case study showing breadth
4. Bridge — connect to what the company specifically needs
5. Close — forward-looking, specific to the team/mission

Rules: concrete outcomes only, ~350 words, tone matched to culture.

### Resume Talking Points
5–7 most relevant achievements from the profile, each with a metric, reframed for this role.

### Approach Angle
- Intersection to lead with
- Positioning frame
- Connections, publications, or side projects to mention
- Suggested email subject line

---

## Proof Points Quick Reference

| Instead of... | Say... |
|---------------|--------|
| "Experience with LLMs" | "Built an NLP-to-structured-query API serving production traffic (FastAPI + LangChain + pgvector)" |
| "UX research skills" | "Ran a 56-person focus group across 10 organizations, delivered 42% reduction in lead time" |
| "Backend engineering" | "Designed a SUSHI-compliant API handling 50K datasets with 70% storage cost reduction (S3/MySQL hybrid)" |
| "Design systems experience" | "Led creation of a WCAG-compliant design system unifying 4 web services, managing a 4-person team" |
| "Publications" | "18+ publications on LLMs, scholarly metadata, and PIDs including research on language UIs for repository discovery" |
| "AI side projects" | "Built Dataset Discovery Agent (AI SDK), ParrotGPT (metadata schema translation), SnowyOwl (async AI dev tool)" |
| "Thought leadership" | "Host Digital Science's AI Technology Radar sessions; maintain a personal tech radar for tool evaluation" |

## Important Notes

- Always read the full reference files before generating any output
- Be honest about gaps — Kristian values authenticity over overselling
- Prioritize roles where the cross-disciplinary intersection is a genuine advantage, not just a checkbox match
- When in doubt about positioning, default to "production AI engineer with deep domain expertise in research infrastructure"
- All searches should include current year to find active postings
- If a career page is behind authentication or can't be fetched, note this and suggest the user check manually
- **The job ad is not the application** — for Deep Analysis and Application Package, always resolve the apply deep link and its form questions via `fetch-application-form.sh`; a package without the form's questions (or an explicit unreadable-form note with the `apply_url`) is incomplete
