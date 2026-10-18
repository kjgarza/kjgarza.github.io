---
name: job-pipeline
description: Autonomous end-to-end job pipeline for Kristian — search, score, decide, prepare full application packages (CV, cover letter, application-form answers, contacts), track state, and notify. Use for "run the job pipeline", "what's in my pipeline", "any new jobs", scheduled/unattended job search runs, or when Kristian wants the whole search→apply flow without prompting each step. Composes find-kristian-jobs, generate-application, and find-linkedin-contacts.
argument-hint: "[run | status | evaluate <url> | approve <url-or-slug> | submit <url-or-slug>]"
---

# job-pipeline

End-to-end orchestrator. One invocation takes a job from *unknown* to *ready-to-submit package + outreach plan* with no human prompting in between. The human is only needed at two points: setting policy (once, in `references/decision-policy.md`) and approving submission.

## State: the ledger

`leads/pipeline.json` at the repo root is the single source of truth. **Read it before doing anything; write it after every state change.**

- If `leads/` or `leads/pipeline.json` doesn't exist yet, create the directory and initialise the ledger to `{}` (then proceed).
- Keyed by job URL. Statuses: `discovered → scored → preparing → prepared → notified → approved → submitted → interviewing → offer`, terminal: `rejected | passed | expired`.
- Never re-fetch, re-score, or re-prepare a URL that's already in the ledger unless its status is `discovered` or the user explicitly asks. This is what stops every run from redoing old work.
- When a posting turns out closed/older than 5 months, set status `expired` with a note — keep the entry so it stays deduplicated.
- Update the `updated` field on every write.

## Decision policy

Read `references/decision-policy.md` before scoring or deciding anything. It encodes Kristian's goals (innovation, compensation, speed) as score modifiers and action thresholds. The policy decides what happens to each job — not the user, not ad-hoc judgment.

## Command routing

| Input | Mode |
|-------|------|
| `/job-pipeline` or `/job-pipeline run` | **Full run** (the default, also used by cron) |
| `/job-pipeline status` | **Status report** from the ledger |
| `/job-pipeline approve <url-or-slug>` | Mark approved, proceed to submission prep |
| `/job-pipeline submit <url-or-slug>` | **Assisted submission** via browser |
| `/job-pipeline evaluate <url>` | **Evaluate one posting** Kristian handed over (also used by the kakapo bot's `/job`) |
| `/job-pipeline cordis [countries]` | **EU-funding outreach scan** (cold-outreach targets, not postings) |

---

## Mode: Full run

Designed to work unattended (cron, remote trigger, `--print`). Never ask interactive questions in this mode; make the policy decision and record it.

### 1 — Sweep the existing pipeline first (don't miss what you already have)

Before searching for anything new:

1. Read `leads/pipeline.json`.
2. Re-check every active posting: `python3 scripts/check-postings.py --apply --report leads/YYYY-MM-DD-posting-check.md`. It covers `prepared`/`notified`/`approved` **and** `submitted`/`interviewing`, using the Greenhouse/Ashby/Lever APIs and scrape-core (plain → Jina → raw HTML) for everything else. With `--apply` it expires closed pre-submit jobs and notes closed post-submit ones (status unchanged — a closed posting is not a rejection). Flag every expiry prominently in the final report ("missed: X closed before submission"). `LIKELY_CLOSED` rows (title gone from a non-ATS page) are never applied — eyeball them. Exit 1 means some checks were `UNKNOWN`: report the run degraded, don't read silence as "open". Also runs weekly on its own (launchd `com.kristiangarza.job-posting-check`).
3. For every `prepared` job missing `answers: true`: generate `application-questions.md` now using generate-application Step 9, set `answers: true`.
4. For every GO job missing `contacts: true`: invoke `find-linkedin-contacts`, save output to the package folder, set `contacts: true`.
5. Flag any job sitting in `prepared`/`notified` for more than 7 days — these are the leaks; speed is a stated goal.

### 2 — Search

Invoke the `find-kristian-jobs` skill, Full Search mode (its budgets and freshness rules apply). Before scoring, drop every URL already present in the ledger. Add each genuinely new posting to the ledger as `discovered`.

### 3 — Score and decide

Score each new posting with the find-kristian-jobs matrix, then apply the modifiers and thresholds from `references/decision-policy.md`. Record `score`, `recommendation`, and the decided action in the ledger (`scored`). Apply the policy actions:

- **AUTO-PREPARE**: run the full generate-application skill (analysis, cv-data.js, cover letter, **application-questions.md**) and `find-linkedin-contacts`, end-to-end, without asking. Ledger → `prepared`, with `package`, `answers`, `contacts` fields set.
- **NOTIFY-ONLY**: ledger → `scored`, include in report for human decision.
- **PASS**: ledger → `passed` with one-line reason. Never silently drop a job — every discovered URL gets a ledger entry.

### 4 — Report and notify

Write the run summary to `leads/YYYY-MM-DD-pipeline-run.md`:

- New jobs found / prepared / passed (with reasons)
- Pipeline health: stale items, expired items ("missed opportunities"), items awaiting approval
- For each prepared package: path, score, deadline if known, and the exact next action ("review answers, then `/job-pipeline submit <url>`")
- Any `⚠️ NEEDS INPUT` fields from application-questions.md files

Then push the summary to Kristian (he is not at the terminal during scheduled runs):
1. **Telegram** if the channel is available: send a short digest (counts + top items + needed decisions) via the telegram reply tool.
2. Otherwise `PushNotification` with a one-line summary.
3. The `openclaw system event` command if running inside the OpenClaw container (detect via `$OPENCLAW_*` env or `/home/node/.openclaw` existing).

### Run budget

One full run = find-kristian-jobs budgets + max 3 AUTO-PREPARE packages. If more than 3 jobs qualify, prepare the 3 highest-scored and leave the rest as `scored` with action `AUTO-PREPARE (deferred)` — the next run picks them up.

---

## Mode: Status report

Read the ledger, print a table grouped by status (active first), flag: stale `prepared` items, unknown deadlines on GO jobs, `⚠️ NEEDS INPUT` markers, anything `expired` in the last 14 days. End with the single most valuable next action.

## Mode: Evaluate one posting (`evaluate <url>`)

Kristian found this posting himself and wants to know whether it fits and, if it does, to have the application ready. Works unattended: the kakapo Telegram bot runs it through `claude --print`, capped at $5 and 20 minutes by default. Never ask interactive questions.

1. **Ledger.** Read `leads/pipeline.json` (the caller has already stripped tracking parameters such as `gh_src` and `utm_*`; key the row by the URL exactly as given). Then by status:
   - absent or `discovered` → continue at step 2.
   - `scored` → this is the deferred or NOTIFY-ONLY job Kristian has now chosen. Re-check it is still open (step 2's fetch), keep the recorded score, and go to step 4.
   - `preparing` → a run stopped part-way. Re-check it is open, then go to step 4 and generate only what the package folder is missing.
   - anything else (`prepared`, `submitted`, `passed`, `expired`, …) → do not redo it: report its current row and stop.
2. **Fetch.** `bash .claude/skills/find-kristian-jobs/scripts/fetch-job.sh "<url>"`. Closed, or older than 5 months → ledger `expired` with a note, report, stop. Otherwise add the URL as `discovered` if it is new.
3. **Score** with the find-kristian-jobs matrix, then the modifiers in `references/decision-policy.md`. Ledger → `scored` with `score`, `recommendation`, and the action.
4. **Decide.** Kristian choosing the posting is the human decision NOTIFY-ONLY waits for, so the bar is the PASS line, not the AUTO-PREPARE one:
   - modified score ≥ 60 → ledger `preparing`, then run generate-application end-to-end (analysis, cv-data.js, rendered CV, application-questions.md, cover letter) and `find-linkedin-contacts`. Ledger → `prepared` with `package`, `answers`, `contacts` set.
   - < 60 → ledger `passed` with the one-line reason in `notes`. No package.
5. **Report** in the final message only — no run-summary file, no Telegram, no PushNotification; the caller relays it. At most eight plain-text lines: company and role, score and recommendation, the ledger status, the package path, every `⚠️ NEEDS INPUT` field, and the single next action (usually "review answers, then `/job-pipeline submit <url>`").

Budget: one package, no optional research. When the caller states a time or money limit, write the ledger after each sub-step (`package` as soon as the folder exists, `answers`/`contacts` as each lands) so a run that is stopped still shows how far it got; a later `/job-pipeline approve` fills in what is missing. Hard rules apply unchanged: ledger first and last, never submit, never send outreach.

## Mode: EU-funding outreach scan (`cordis`)

A second lead source for the AI × research-ecosystem niche (research infrastructure, scholarly publishing, research integrity/assessment, research data, PIDs, scholarly knowledge graphs), where much of the money is EU grants and roles are rarely posted on job boards.

1. Run `python3 scripts/cordis-leads.py` (add `--country DE,NL,…` if asked). It downloads the CORDIS Horizon Europe dump (cached a week in `~/.cache/cordis-leads/`) and scans every open/upcoming call on the Funding & Tenders Portal, writing to `leads/cordis/YYYY-MM-DD-*`: a markdown report plus `organisations.csv`, `projects.csv` and `calls.csv`.
2. Read the report and summarise the top targets. Hiring happens mostly in a project's first ~9 months, so lead with the **companies and non-profits** table (they hire/contract without formal postings) and the **hiring-window** projects, with named work packages Kristian could own (AI, knowledge graphs, PIDs, metadata).
3. For the organisations Kristian picks, run `find-linkedin-contacts` against the organisation, targeting project coordinators and work-package leads (CORDIS has no person names — get them from the project website).
4. Open calls are for *consortium-formation* outreach: offer to be named as expert/subcontractor to organisations likely to bid (repeat winners of the same topic family).

These are organisations, not job URLs: **do not add them to `leads/pipeline.json`**. If an outreach turns into a real role, add that role's URL to the ledger as usual. Outreach is never sent without explicit approval.

## Mode: Approve

Set the job's status to `approved`. Verify the package is complete (analysis, cv-data.js, cover letter, application-questions.md, contacts); generate anything missing. Re-check the posting is still open. Then offer `/job-pipeline submit`.

## Mode: Assisted submission (human stays in the loop)

Submission is the one irreversible, outward-facing step — it is **never** done unattended.

1. Job must be `approved` (or the user is asking interactively right now — that counts as approval).
2. Open the apply page: `mcp__claude-in-chrome__tabs_create_mcp` → `mcp__claude-in-chrome__navigate` → `mcp__claude-in-chrome__read_page`.
3. Fill every field from `application-questions.md` using `mcp__claude-in-chrome__form_input`; upload the CV PDF with `mcp__claude-in-chrome__file_upload` (ask for the path if no PDF exists in the package — or build it from cv-data.js first).
4. Refuse to proceed if any `⚠️ NEEDS INPUT` field is unresolved.
5. **Stop before clicking the final submit button.** Screenshot the filled form (`mcp__claude-in-chrome__computer`, screenshot action), show it, and get an explicit yes. Only then click submit.
6. Ledger → `submitted` with date; suggest sending the P1 outreach messages from the contacts file.

---

## Hard rules

- Ledger first, ledger last — a run that doesn't update `leads/pipeline.json` is a failed run.
- Never submit, send, or publish anything external without explicit human approval in the same conversation.
- Honest packages: same authenticity rules as generate-application — no invented experience, gaps stated.
- All money/relocation/start-date answers come from the decision policy, never improvised.
